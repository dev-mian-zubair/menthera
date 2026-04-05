import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export interface QuestStackProps extends StackProps {
  environment: string;
  questSessionsTable: TableV2;
  questDefinitionsTable: TableV2;
  usersTable: TableV2;
  agentsTable: TableV2;
  messagesTable: TableV2;
  restApiId: string;
  rootResourceId: string;
  appSecret: Secret;
}

export class QuestStack extends Stack {
  public readonly questHandler: NodejsFunction;
  public readonly insightsQueue: sqs.Queue;
  public readonly insightsProcessor: NodejsFunction;

  constructor(scope: Construct, id: string, props: QuestStackProps) {
    super(scope, id, props);

    const {
      environment,
      questSessionsTable,
      questDefinitionsTable,
      usersTable,
      agentsTable,
      messagesTable,
      restApiId,
      rootResourceId,
      appSecret
    } = props;

    // Import the API Gateway created in ApiGatewayStack
    const apiGateway = RestApi.fromRestApiAttributes(this, 'ImportedApi', {
      restApiId: restApiId,
      rootResourceId: rootResourceId,
    });

    // Quest Lambda Function (renamed from onboarding)
    this.questHandler = new NodejsFunction(
      this,
      `${id}-quest-handler`,
      {
        functionName: `${id}-quest-handler`,
        runtime: lambda.Runtime.NODEJS_22_X,
        memorySize: 1024, // For LLM operations
        timeout: cdk.Duration.seconds(120), // For LLM generation + scoring
        entry: 'src/services/quests/api.ts',
        handler: 'default',
        bundling: {
          sourceMap: true,
          externalModules: ['aws-sdk'],
          preCompilation: false,
        },
        environment: {
          ENVIRONMENT: environment,
          QUEST_SESSIONS_TABLE_NAME: questSessionsTable.tableName,
          QUEST_DEFINITIONS_TABLE_NAME: questDefinitionsTable.tableName,
          USERS_TABLE_NAME: usersTable.tableName,
          AGENTS_TABLE_NAME: agentsTable.tableName,
          APP_SECRET_NAME: appSecret.secretName,
        },
      }
    );

    // Create SQS Queue for Insights Generation
    const insightsDeadLetterQueue = new sqs.Queue(this, `${id}-insights-dlq`, {
      queueName: `${id}-insights-dlq`,
      retentionPeriod: cdk.Duration.days(14),
    });

    this.insightsQueue = new sqs.Queue(this, `${id}-insights-queue`, {
      queueName: `${id}-insights-queue`,
      visibilityTimeout: cdk.Duration.seconds(300), // 5 minutes for LLM processing
      receiveMessageWaitTime: cdk.Duration.seconds(20), // Long polling
      deadLetterQueue: {
        queue: insightsDeadLetterQueue,
        maxReceiveCount: 3, // Retry up to 3 times
      },
    });

    // Insights Processor Lambda
    this.insightsProcessor = new NodejsFunction(
      this,
      `${id}-insights-processor`,
      {
        functionName: `${id}-insights-processor`,
        runtime: lambda.Runtime.NODEJS_22_X,
        memorySize: 2048, // Higher memory for LLM processing
        timeout: cdk.Duration.seconds(300), // 5 minutes for LLM API calls
        entry: 'src/services/quests/insights-processor.ts',
        handler: 'handler',
        bundling: {
          sourceMap: true,
          externalModules: ['aws-sdk'],
          preCompilation: false,
        },
        environment: {
          ENVIRONMENT: environment,
          QUEST_SESSIONS_TABLE_NAME: questSessionsTable.tableName,
          QUEST_DEFINITIONS_TABLE_NAME: questDefinitionsTable.tableName,
          MESSAGES_TABLE_NAME: messagesTable.tableName,
          APP_SECRET_NAME: appSecret.secretName,
        },
        events: [
          new SqsEventSource(this.insightsQueue, {
            batchSize: 1, // Process one quest at a time
            maxBatchingWindow: cdk.Duration.seconds(0),
          }),
        ],
      }
    );

    // Grant permissions to the quest handler lambda
    questSessionsTable.grantReadWriteData(this.questHandler);
    questDefinitionsTable.grantReadData(this.questHandler);
    usersTable.grantReadData(this.questHandler);
    agentsTable.grantReadData(this.questHandler);
    appSecret.grantRead(this.questHandler);

    // Update quest handler environment with queue URL
    this.questHandler.addEnvironment('QUEST_INSIGHTS_QUEUE_URL', this.insightsQueue.queueUrl);

    // Grant SQS send permission to quest handler
    this.insightsQueue.grantSendMessages(this.questHandler);

    // Grant permissions to insights processor
    questSessionsTable.grantReadWriteData(this.insightsProcessor);
    questDefinitionsTable.grantReadData(this.insightsProcessor);
    messagesTable.grantReadWriteData(this.insightsProcessor);
    appSecret.grantRead(this.insightsProcessor);

    // Grant API Gateway permissions to invoke the lambda function
    this.questHandler.addPermission(
      `QuestHandler-ApiGatewayInvoke-${environment}`,
      {
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: apiGateway.arnForExecuteApi(),
      }
    );

    // Add resources to the API Gateway
    // /quests - Quest endpoints
    const questsResource = apiGateway.root.addResource('quests');

    // /quests/{agentId}
    const agentResource = questsResource.addResource('{agentId}');

    // GET /quests/{agentId} - Fetch quest definition
    agentResource.addMethod('GET', new apigateway.LambdaIntegration(this.questHandler));

    // /quests/{agentId}/start
    const startResource = agentResource.addResource('start');
    startResource.addMethod('POST', new apigateway.LambdaIntegration(this.questHandler));

    // /quests/{agentId}/submit
    const submitResource = agentResource.addResource('submit');
    submitResource.addMethod('POST', new apigateway.LambdaIntegration(this.questHandler));

    // /quests/{agentId}/report
    const reportResource = agentResource.addResource('report');
    reportResource.addMethod('GET', new apigateway.LambdaIntegration(this.questHandler));
  }
}
