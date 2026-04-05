import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface MessageStackProps extends StackProps {
  environment: string;
  messagesTable: TableV2;
  usersTable: TableV2;
  agentsTable: TableV2;
  questSessionsTable: TableV2;
  questDefinitionsTable: TableV2;
  filesBucket: Bucket;
  appSecret: Secret;
  appDomain?: string;
  rateLimitsTable: TableV2;
}

export class MessageStack extends Stack {
  public readonly messageHandler: NodejsFunction;
  public readonly functionUrl: lambda.FunctionUrl;

  constructor(scope: Construct, id: string, props: MessageStackProps) {
    super(scope, id, props);

    const { environment, messagesTable, usersTable, agentsTable, questSessionsTable, questDefinitionsTable, filesBucket, appSecret, appDomain, rateLimitsTable } = props;

    // Message Lambda Function - Single handler for message posting and conversation history
    this.messageHandler = new NodejsFunction(
      this,
      `${id}-message-handler`,
      {
        functionName: `${id}-message-handler`,
        runtime: lambda.Runtime.NODEJS_22_X,
        memorySize: 1024, // Increased from 512 for LLM streaming
        timeout: cdk.Duration.seconds(60), // Increased from 30 to allow LLM response time
        entry: 'src/services/message/api.ts',
        handler: 'default', // Using default export from streamHandle(app)
        currentVersionOptions: {
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        },
        bundling: {
          sourceMap: true,
          externalModules: ['aws-sdk'],
          preCompilation: false,
        },
        environment: {
          ENVIRONMENT: environment,
          MESSAGES_TABLE_NAME: messagesTable.tableName,
          USERS_TABLE_NAME: usersTable.tableName,
          AGENTS_TABLE_NAME: agentsTable.tableName,
          QUEST_SESSIONS_TABLE_NAME: questSessionsTable.tableName,
          QUEST_DEFINITIONS_TABLE_NAME: questDefinitionsTable.tableName,
          APP_SECRET_NAME: appSecret.secretName,
          RATE_LIMIT_TABLE_NAME: rateLimitsTable.tableName,
          // Memory search configuration - lower values return more results
          MEM0_SEARCH_THRESHOLD: '0.1',
        },
      }
    );

    // Grant permissions to the lambda function
    messagesTable.grantReadWriteData(this.messageHandler);
    usersTable.grantReadWriteData(this.messageHandler); // Changed from grantReadData to allow usage quota updates
    agentsTable.grantReadData(this.messageHandler);
    questSessionsTable.grantReadData(this.messageHandler);
    questDefinitionsTable.grantReadData(this.messageHandler);
    rateLimitsTable.grantReadWriteData(this.messageHandler);
    appSecret.grantRead(this.messageHandler);
    filesBucket.grantReadWrite(this.messageHandler);

    // Create Lambda Function URL for direct invocation (for streaming responses)
    this.functionUrl = this.messageHandler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.AWS_IAM, // Only CloudFront can invoke via OAC (Clerk auth handled by middleware)
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM, // Enable response streaming for real-time message chunks
      cors: {
        allowedMethods: [lambda.HttpMethod.POST, lambda.HttpMethod.GET],
        allowedOrigins: [appDomain || 'https://app.example.com'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Output the Lambda Function URL
    new CfnOutput(this, 'MessageHandlerFunctionUrl', {
      value: this.functionUrl.url,
      description: 'Direct Lambda Function URL for Message Handler (supports streaming)',
      exportName: `${id}-FunctionUrl`,
    });
  }
}
