import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Stack, StackProps } from 'aws-cdk-lib';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface UsersStackProps extends StackProps {
  environment: string;
  usersTable: TableV2;
  subscriptionAuditTable: TableV2;
  webhookIdempotencyTable: TableV2;
  messagesTable: TableV2;
  callsTable: TableV2;
  questSessionsTable: TableV2;
  userActivityTable: TableV2;
  userStreaksTable: TableV2;
  userAchievementsTable: TableV2;
  restApiId: string;
  rootResourceId: string;
  appSecret: Secret;
}

export class UsersStack extends Stack {
  public readonly usersHandler: NodejsFunction;
  public readonly webhookProcessorHandler: NodejsFunction;
  public readonly webhookQueue: sqs.Queue;
  public readonly webhookDLQ: sqs.Queue;

  constructor(scope: Construct, id: string, props: UsersStackProps) {
    super(scope, id, props);

    const {
      environment,
      usersTable,
      subscriptionAuditTable,
      webhookIdempotencyTable,
      messagesTable,
      callsTable,
      questSessionsTable,
      userActivityTable,
      userStreaksTable,
      userAchievementsTable,
      restApiId,
      rootResourceId,
      appSecret,
    } = props;

    // Import the API Gateway created in ApiGatewayStack
    const apiGateway = apigateway.RestApi.fromRestApiAttributes(this, 'ImportedApi', {
      restApiId: restApiId,
      rootResourceId: rootResourceId,
    });

    // ============================================
    // SQS QUEUES FOR WEBHOOK PROCESSING
    // ============================================

    // Dead Letter Queue - captures failed webhook events after max retries
    this.webhookDLQ = new sqs.Queue(this, 'WebhookDLQ', {
      queueName: `${environment}-webhook-dlq`,
      retentionPeriod: cdk.Duration.days(14), // Keep failed events for 14 days
    });

    // Main webhook processing queue
    this.webhookQueue = new sqs.Queue(this, 'WebhookQueue', {
      queueName: `${environment}-webhook-queue`,
      visibilityTimeout: cdk.Duration.seconds(90), // 3x the processor Lambda timeout
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        queue: this.webhookDLQ,
        maxReceiveCount: 3, // Retry 3 times before sending to DLQ
      },
    });

    // ============================================
    // WEBHOOK PROCESSOR LAMBDA (SQS consumer)
    // ============================================

    this.webhookProcessorHandler = new NodejsFunction(
      this,
      `${id}-webhook-processor`,
      {
        functionName: `${id}-webhook-processor`,
        runtime: lambda.Runtime.NODEJS_22_X,
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        entry: 'src/services/users/webhook-processor.ts',
        handler: 'handler',
        bundling: {
          sourceMap: true,
          externalModules: ['aws-sdk'],
          preCompilation: false,
        },
        environment: {
          ENVIRONMENT: environment,
          USERS_TABLE_NAME: usersTable.tableName,
          SUBSCRIPTION_AUDIT_TABLE_NAME: subscriptionAuditTable.tableName,
          WEBHOOK_IDEMPOTENCY_TABLE_NAME: webhookIdempotencyTable.tableName,
        },
      }
    );

    // Grant the processor Lambda access to tables
    usersTable.grantReadWriteData(this.webhookProcessorHandler);
    subscriptionAuditTable.grantWriteData(this.webhookProcessorHandler);
    webhookIdempotencyTable.grantReadWriteData(this.webhookProcessorHandler);

    // Wire SQS as event source for the processor
    this.webhookProcessorHandler.addEventSource(
      new lambdaEventSources.SqsEventSource(this.webhookQueue, {
        batchSize: 1,
        maxBatchingWindow: cdk.Duration.seconds(0),
        reportBatchItemFailures: true,
      })
    );

    // ============================================
    // USERS LAMBDA (API handler)
    // ============================================

    this.usersHandler = new NodejsFunction(
      this,
      `${id}-users-handler`,
      {
        functionName: `${id}-users-handler`,
        runtime: lambda.Runtime.NODEJS_22_X,
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        entry: 'src/services/users/api.ts',
        handler: 'default',
        bundling: {
          sourceMap: true,
          externalModules: ['aws-sdk'],
          preCompilation: false,
        },
        environment: {
          ENVIRONMENT: environment,
          APP_SECRET_NAME: appSecret.secretName,
          USERS_TABLE_NAME: usersTable.tableName,
          MESSAGES_TABLE_NAME: messagesTable.tableName,
          CALLS_TABLE_NAME: callsTable.tableName,
          QUEST_SESSIONS_TABLE_NAME: questSessionsTable.tableName,
          USER_ACTIVITY_TABLE_NAME: userActivityTable.tableName,
          USER_STREAKS_TABLE_NAME: userStreaksTable.tableName,
          USER_ACHIEVEMENTS_TABLE_NAME: userAchievementsTable.tableName,
          SUBSCRIPTION_AUDIT_TABLE_NAME: subscriptionAuditTable.tableName,
          WEBHOOK_QUEUE_URL: this.webhookQueue.queueUrl,
        },
      }
    );

    // Grant permissions to the users handler
    usersTable.grantReadWriteData(this.usersHandler);
    appSecret.grantRead(this.usersHandler);
    this.webhookQueue.grantSendMessages(this.usersHandler);

    // Grant cascading delete permissions
    messagesTable.grantReadWriteData(this.usersHandler);
    callsTable.grantReadWriteData(this.usersHandler);
    questSessionsTable.grantReadWriteData(this.usersHandler);
    userActivityTable.grantReadWriteData(this.usersHandler);
    userStreaksTable.grantReadWriteData(this.usersHandler);
    userAchievementsTable.grantReadWriteData(this.usersHandler);
    subscriptionAuditTable.grantReadWriteData(this.usersHandler);

    // Grant API Gateway permissions to invoke the lambda function
    this.usersHandler.addPermission(
      `UsersHandler-ApiGatewayInvoke-${environment}`,
      {
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: apiGateway.arnForExecuteApi(),
      }
    );

    // ============================================
    // API GATEWAY ROUTES
    // ============================================

    const usersResource = apiGateway.root.addResource('users');

    const usageResource = usersResource.addResource('usage');
    usageResource.addMethod('GET', new apigateway.LambdaIntegration(this.usersHandler));

    const demographicsResource = usersResource.addResource('demographics');
    demographicsResource.addMethod('PUT', new apigateway.LambdaIntegration(this.usersHandler));

    const deleteUserResource = usersResource.addResource('unregister');
    deleteUserResource.addMethod('DELETE', new apigateway.LambdaIntegration(this.usersHandler));

    const onboardingResource = usersResource.addResource('onboarding');
    onboardingResource.addMethod('POST', new apigateway.LambdaIntegration(this.usersHandler));

    const apiKeyResource = usersResource.addResource('api-key');
    apiKeyResource.addMethod('POST', new apigateway.LambdaIntegration(this.usersHandler));
    apiKeyResource.addMethod('GET', new apigateway.LambdaIntegration(this.usersHandler));
    apiKeyResource.addMethod('DELETE', new apigateway.LambdaIntegration(this.usersHandler));

    // Webhook resources
    const webhooksResource = apiGateway.root.addResource('webhooks');

    const clerkWebhookResource = webhooksResource.addResource('clerk');
    clerkWebhookResource.addMethod('POST', new apigateway.LambdaIntegration(this.usersHandler));

    const revenuecatWebhookResource = webhooksResource.addResource('revenuecat');
    revenuecatWebhookResource.addMethod('POST', new apigateway.LambdaIntegration(this.usersHandler));
  }
}
