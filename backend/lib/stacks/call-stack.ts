import { Stack, StackProps, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as path from 'path';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { RestApi, LambdaIntegration, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { CallAlarms } from '../constructs/call-alarms';

export interface CallStackProps extends StackProps {
  environment: string;
  roomsTable: TableV2;
  callsTable: TableV2;
  usersTable: TableV2;
  agentsTable: TableV2;
  rateLimitsTable: TableV2;
  appSecret: Secret;
  restApiId: string;
  rootResourceId: string;
  alarmEmail?: string; // Optional email for alarm notifications
}

export class CallStack extends Stack {
  constructor(scope: Construct, id: string, props: CallStackProps) {
    super(scope, id, props);

    const { environment, roomsTable, callsTable, usersTable, agentsTable, rateLimitsTable, appSecret, restApiId, rootResourceId } = props;

    // Import the API Gateway created in ApiGatewayStack
    const apiGateway = RestApi.fromRestApiAttributes(this, 'ImportedApi', {
      restApiId: restApiId,
      rootResourceId: rootResourceId,
    });

    // ⚡ VPC
    const vpc = new ec2.Vpc(this, 'CallVpc', {
      maxAzs: 2,
      natGateways: environment === 'production' ? 1 : 0,
    });

    // Endpoints
    vpc.addGatewayEndpoint('S3Endpoint', { service: ec2.GatewayVpcEndpointAwsService.S3 });
    [ec2.InterfaceVpcEndpointAwsService.ECR, ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER, ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS]
      .forEach((svc, i) => vpc.addInterfaceEndpoint(`Endpoint${i}`, { service: svc }));

    const ecsSg = new ec2.SecurityGroup(this, 'EcsTaskSG', {
      vpc,
      allowAllOutbound: true,
    });
    // Apply removal policy to security group
    (ecsSg.node.defaultChild as any).applyRemovalPolicy(RemovalPolicy.DESTROY);

    // ⚡ ECS Cluster
    const cluster = new ecs.Cluster(this, 'CallCluster', {
      vpc,
      clusterName: `${id}-call-cluster`,
    });

    // ⚡ Log Group
    const logGroup = new logs.LogGroup(this, 'EcsLogGroup', {
      logGroupName: `/ecs/${id}-pipecat`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // ⚡ Docker Image (Dev = local build, Prod = pull from ECR)
    let pipecatImage: ecs.ContainerImage;

    if (environment === 'production') {
      const repo = ecr.Repository.fromRepositoryName(this, 'PipecatRepo', 'pipecat-repo');
      pipecatImage = ecs.ContainerImage.fromEcrRepository(repo, 'latest'); // or use a CI-provided tag
    } else {
      const asset = new DockerImageAsset(this, 'PipecatImage', {
        directory: path.join(__dirname, '../../pipecat'),
        invalidation: {
          buildArgs: true,
          repositoryName: true,
        },
      });

      pipecatImage = ecs.ContainerImage.fromDockerImageAsset(asset);
    }

    // ⚡ Task Definition
    const taskDef = new ecs.FargateTaskDefinition(this, 'PipecatTask', {
      memoryLimitMiB: 512,
      cpu: 256,
      // Force new revision with corrected Docker image (platform fix)
      family: `${id}PipecatTask-v4`,
    });

    // Grant DynamoDB permissions to ECS task role for updating call status and user usage
    callsTable.grantReadWriteData(taskDef.taskRole);
    usersTable.grantReadWriteData(taskDef.taskRole);

    // Explicitly grant UpdateItem permission for DynamoDB operations
    taskDef.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:UpdateItem', 'dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query', 'dynamodb:Scan'],
        resources: [callsTable.tableArn, usersTable.tableArn],
      })
    );

    // ⚡ SQS QUEUE FOR CALL EVENTS
    // Dead Letter Queue for failed processing
    const callEventsDLQ = new sqs.Queue(this, 'CallEventsDLQ', {
      queueName: `${id}-call-events-dlq`,
      retentionPeriod: Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    // Main Queue for call end events
    const callEventsQueue = new sqs.Queue(this, 'CallEventsQueue', {
      queueName: `${id}-call-events`,
      visibilityTimeout: Duration.minutes(5),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: callEventsDLQ,
        maxReceiveCount: 3,
      },
    });

    // ⚡ SQS QUEUE FOR BOT ASSIGNMENTS (Warm Pool)
    // Dead Letter Queue for failed bot assignments
    const botAssignmentsDLQ = new sqs.Queue(this, 'BotAssignmentsDLQ', {
      queueName: `${id}-bot-assignments-dlq`,
      retentionPeriod: Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Main Queue for bot call assignments
    const botAssignmentsQueue = new sqs.Queue(this, 'BotAssignmentsQueue', {
      queueName: `${id}-bot-assignments`,
      visibilityTimeout: Duration.minutes(10),
      receiveMessageWaitTime: Duration.seconds(20),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: botAssignmentsDLQ,
        maxReceiveCount: 3,
      },
      retentionPeriod: Duration.hours(1),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // ⚡ CALL PROCESSOR LAMBDA
    const callProcessorFn = new lambdaNodejs.NodejsFunction(
      this,
      'CallProcessorFn',
      {
        functionName: `${id}-call-processor`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: 'src/services/call/processor.ts',
        handler: 'handler',
        timeout: Duration.minutes(5), // Allow time for LLM summarization
        memorySize: 1024, // Need more memory for LLM calls
        environment: {
          NODE_ENV: environment,
          CALLS_TABLE_NAME: callsTable.tableName,
          USERS_TABLE_NAME: usersTable.tableName,
          AGENTS_TABLE_NAME: agentsTable.tableName,
          APP_SECRET_NAME: appSecret.secretName,
          // Memory search configuration - lower values return more results
          MEM0_SEARCH_THRESHOLD: '0.1',
        },
        bundling: {
          minify: true,
          sourceMap: true,
        },
      }
    );

    // Grant permissions to call processor
    callsTable.grantReadWriteData(callProcessorFn);
    usersTable.grantReadData(callProcessorFn);
    agentsTable.grantReadData(callProcessorFn);
    appSecret.grantRead(callProcessorFn);

    // Grant CloudWatch Metrics permissions for call processor
    callProcessorFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'], // PutMetricData requires wildcard
      conditions: {
        StringEquals: {
          'cloudwatch:namespace': 'Menthera/CallService',
        },
      },
    }));

    // Add SQS as event source for processor
    callProcessorFn.addEventSource(
      new lambdaEventSources.SqsEventSource(callEventsQueue, {
        batchSize: 1, // Process one call at a time
        reportBatchItemFailures: true,
      })
    );

    taskDef.addContainer('PipecatContainer', {
      image: pipecatImage,
      memoryLimitMiB: 512,
      environment: {
        ENVIRONMENT: environment,
        APPLICATION_NAME: 'pipecat',
        VERSION: '1.0.0',
        CALLS_TABLE_NAME: callsTable.tableName,
        USERS_TABLE_NAME: usersTable.tableName,
        CALL_EVENTS_QUEUE_URL: callEventsQueue.queueUrl,
        BOT_ASSIGNMENTS_QUEUE_URL: botAssignmentsQueue.queueUrl, // NEW: For warm pool
        BOT_POOL_MODE: 'true', // NEW: Enable warm pool polling mode
        AWS_REGION: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      },
      secrets: {
        DAILY_API_KEY: ecs.Secret.fromSecretsManager(appSecret, 'DAILY_API_KEY'),
        OPENAI_API_KEY: ecs.Secret.fromSecretsManager(appSecret, 'OPENAI_API_KEY'),
        ELEVENLABS_API_KEY: ecs.Secret.fromSecretsManager(appSecret, 'ELEVENLABS_API_KEY'),
        CARTESIA_API_KEY: ecs.Secret.fromSecretsManager(appSecret, 'CARTESIA_API_KEY'),
        ANTHROPIC_API_KEY: ecs.Secret.fromSecretsManager(appSecret, 'ANTHROPIC_API_KEY'),
      },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'pipecat', logGroup }),
    });

    // Grant SQS permissions to ECS task role
    callEventsQueue.grantSendMessages(taskDef.taskRole);
    // Grant permissions to poll bot assignments queue (warm pool mode)
    botAssignmentsQueue.grantConsumeMessages(taskDef.taskRole);

    // ⚡ WARM POOL FARGATE SERVICE
    // Create always-on Fargate service for instant call assignments
    const warmPoolService = new ecs.FargateService(this, 'WarmBotPool', {
      cluster,
      taskDefinition: taskDef,
      serviceName: `${id}-warm-bot-pool`,
      desiredCount: environment === 'production' ? 3 : 2, // Prod: 3 bots, Dev: 2 bots
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      enableExecuteCommand: true, // Allow debugging via ECS Exec
      platformVersion: ecs.FargatePlatformVersion.LATEST,
      assignPublicIp: true, // Required for Fargate in public subnets
      securityGroups: [ecsSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      healthCheckGracePeriod: Duration.seconds(60),
    });

    // ⚡ AUTO-SCALING FOR WARM POOL
    // Scale based on queue depth for cost optimization
    const scaling = warmPoolService.autoScaleTaskCount({
      minCapacity: environment === 'production' ? 3 : 2,
      maxCapacity: environment === 'production' ? 10 : 5,
    });

    // Scale up when queue has messages waiting
    scaling.scaleOnMetric('QueueDepthScaling', {
      metric: botAssignmentsQueue.metricApproximateNumberOfMessagesVisible({
        period: Duration.minutes(1),
        statistic: 'Average',
      }),
      scalingSteps: [
        { upper: 0, change: 0 },     // No messages: don't scale
        { lower: 1, change: +1 },    // 1-4 messages: add 1 bot
        { lower: 5, change: +2 },    // 5-9 messages: add 2 bots
        { lower: 10, change: +3 },   // 10+ messages: add 3 bots
      ],
      adjustmentType: applicationautoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      cooldown: Duration.minutes(3), // Wait 3 min between scaling actions
    });

    // Scale down when queue is empty for extended period
    scaling.scaleOnMetric('QueueEmptyScaleDown', {
      metric: botAssignmentsQueue.metricApproximateNumberOfMessagesVisible({
        period: Duration.minutes(5),
        statistic: 'Average',
      }),
      scalingSteps: [
        { upper: 0, change: -1 },  // Queue empty for 5 min: remove 1 bot
        { lower: 1, change: 0 },   // 1+ messages: no change (required 2nd interval)
      ],
      adjustmentType: applicationautoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      cooldown: Duration.minutes(10), // Wait 10 min before scaling down again
    });

    // ⚡ Lambda Function
    const lambdaFn = new lambdaNodejs.NodejsFunction(this, 'CreateCallFn', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: 'src/services/call/handler.ts',
      handler: 'handler',
      timeout: Duration.minutes(2),
      memorySize: 256,
      environment: {
        NODE_ENV: environment,
        LOG_LEVEL: environment === 'production' ? 'info' : 'debug',
        APP_SECRET_NAME: appSecret.secretName,
        ECS_CLUSTER_NAME: cluster.clusterName,
        ECS_CLUSTER_ARN: cluster.clusterArn,
        ECS_TASK_DEFINITION_ARN: taskDef.taskDefinitionArn,
        ECS_SUBNETS: vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }).subnets.map(s => s.subnetId).join(','),
        VPC_ID: vpc.vpcId,
        SECURITY_GROUP_ID: ecsSg.securityGroupId,
        ROOMS_TABLE_NAME: roomsTable.tableName,
        CALLS_TABLE_NAME: callsTable.tableName,
        USERS_TABLE_NAME: usersTable.tableName,
        AGENTS_TABLE_NAME: agentsTable.tableName,
        RATE_LIMIT_TABLE_NAME: rateLimitsTable.tableName,
        BOT_ASSIGNMENTS_QUEUE_URL: botAssignmentsQueue.queueUrl, // NEW: For warm pool assignments
        ENABLE_WARM_POOL: 'true', // NEW: Enable warm pool mode (set to 'false' to use cold start)
      },
      bundling: {
        minify: true,
        preCompilation: false,
      },
    });

    // IAM: Grant only what's needed
    lambdaFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ecs:RunTask', 'ecs:DescribeTasks'],
      resources: [taskDef.taskDefinitionArn],
    }));
    // Grant permission to list tasks for task limit checking
    lambdaFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ecs:ListTasks'],
      resources: ['*'], // ListTasks requires wildcard resource
    }));
    lambdaFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ec2:DescribeSubnets', 'ec2:DescribeVpcs', 'ec2:DescribeSecurityGroups'],
      resources: ['*'],
    }));
    lambdaFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [taskDef.taskRole.roleArn, taskDef.executionRole!.roleArn],
    }));

    // Grant DynamoDB permissions for rooms, calls, agents, users, and rate limits tables
    roomsTable.grantReadWriteData(lambdaFn);
    callsTable.grantReadWriteData(lambdaFn);
    agentsTable.grantReadData(lambdaFn);
    usersTable.grantReadWriteData(lambdaFn);
    rateLimitsTable.grantReadWriteData(lambdaFn);

    // Grant Secrets Manager permissions for app secret
    appSecret.grantRead(lambdaFn);

    // Grant SQS permissions to send bot assignments
    botAssignmentsQueue.grantSendMessages(lambdaFn);

    // Grant CloudWatch Metrics permissions for custom metrics
    lambdaFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'], // PutMetricData requires wildcard
      conditions: {
        StringEquals: {
          'cloudwatch:namespace': 'Menthera/CallService',
        },
      },
    }));

    // Grant API Gateway permissions to invoke the lambda function
    lambdaFn.addPermission(`CallHandler-ApiGatewayInvoke-${environment}`, {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: apiGateway.arnForExecuteApi(),
    });

    // ⚡ HEALTH CHECK LAMBDA
    const healthCheckFn = new lambdaNodejs.NodejsFunction(this, 'HealthCheckFn', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: 'src/services/call/health.ts',
      handler: 'handler',
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        NODE_ENV: environment,
        CALLS_TABLE_NAME: callsTable.tableName,
        ECS_CLUSTER_ARN: cluster.clusterArn,
        VERSION: '1.0.0',
      },
      bundling: {
        minify: true,
      },
    });

    // Grant health check permissions (read-only)
    callsTable.grantReadData(healthCheckFn);
    healthCheckFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ecs:DescribeClusters'],
      resources: [cluster.clusterArn],
    }));

    // Grant API Gateway permissions to invoke health check
    healthCheckFn.addPermission(`HealthCheck-ApiGatewayInvoke-${environment}`, {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: apiGateway.arnForExecuteApi(),
    });

    // ⚡ USER LEFT HANDLER LAMBDA
    const userLeftFn = new lambdaNodejs.NodejsFunction(this, 'UserLeftFn', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: 'src/services/call/user-left-handler.ts',
      handler: 'handler',
      timeout: Duration.seconds(45), // 15s graceful shutdown + auth + ECS stop margin
      memorySize: 256,
      environment: {
        NODE_ENV: environment,
        CALLS_TABLE_NAME: callsTable.tableName,
        APP_SECRET_NAME: appSecret.secretName,
        ECS_CLUSTER_NAME: cluster.clusterName,
        // AWS_REGION is automatically provided by Lambda runtime
      },
      bundling: {
        minify: true,
      },
    });

    // Grant permissions to user-left handler
    callsTable.grantReadWriteData(userLeftFn);
    appSecret.grantRead(userLeftFn);

    // Grant ECS StopTask permission
    userLeftFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ecs:StopTask'],
      resources: ['*'], // StopTask requires wildcard or specific task ARNs (runtime)
    }));

    // Grant CloudWatch Metrics permissions
    userLeftFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'],
      conditions: {
        StringEquals: {
          'cloudwatch:namespace': 'Menthera/CallService',
        },
      },
    }));

    // Grant API Gateway permissions to invoke user-left handler
    userLeftFn.addPermission(`UserLeft-ApiGatewayInvoke-${environment}`, {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: apiGateway.arnForExecuteApi(),
    });

    // ⚡ API Gateway
    const callResource = apiGateway.root.addResource('call');
    // Auth is handled at the Lambda level via Clerk JWT verification middleware
    // (API Gateway authorizers add latency unsuitable for real-time call endpoints)
    callResource.addMethod('POST', new LambdaIntegration(lambdaFn), {
      authorizationType: AuthorizationType.NONE,
    });

    // Add health endpoint under /call/health
    const healthResource = callResource.addResource('health');
    healthResource.addMethod('GET', new LambdaIntegration(healthCheckFn), {
      authorizationType: AuthorizationType.NONE,
    });

    // Add user-left endpoint under /call/{callId}/user-left
    const callIdResource = callResource.addResource('{callId}');
    const userLeftResource = callIdResource.addResource('user-left');
    // Auth is handled at the Lambda level via Clerk JWT verification
    userLeftResource.addMethod('POST', new LambdaIntegration(userLeftFn), {
      authorizationType: AuthorizationType.NONE,
    });

    // Enable CORS for the /call resource
    callResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      maxAge: Duration.seconds(3600),
    });

    // Enable CORS for the /call/health resource
    healthResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET', 'OPTIONS'],
      allowHeaders: ['Content-Type'],
      maxAge: Duration.seconds(3600),
    });

    // Enable CORS for the /call/{callId}/user-left resource
    userLeftResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      maxAge: Duration.seconds(3600),
    });

    // ⚡ Outputs
    new CfnOutput(this, 'LambdaFnUrl', { value: lambdaFn.functionName });
    new CfnOutput(this, 'ClusterName', { value: cluster.clusterName });
    new CfnOutput(this, 'TaskDefArn', { value: taskDef.taskDefinitionArn });
    new CfnOutput(this, 'CallEventsQueueUrl', {
      value: callEventsQueue.queueUrl,
      description: 'SQS Queue URL for call events',
    });
    new CfnOutput(this, 'CallProcessorFnArn', {
      value: callProcessorFn.functionArn,
      description: 'Call Processor Lambda ARN',
    });

    // ⚡ CloudWatch Alarms
    const alarms = new CallAlarms(this, 'CallAlarms', {
      environment,
      createCallFunction: lambdaFn,
      callProcessorFunction: callProcessorFn,
      callEventsDLQ,
      // ⚡ WARM POOL MONITORING
      botAssignmentsQueue,
      botAssignmentsDLQ,
      warmPoolService,
      alarmEmail: props.alarmEmail,
    });

    new CfnOutput(this, 'AlarmTopicArn', {
      value: alarms.alarmTopic.topicArn,
      description: 'SNS Topic ARN for Call Service Alarms',
    });

    new CfnOutput(this, 'HealthCheckFnArn', {
      value: healthCheckFn.functionArn,
      description: 'Health Check Lambda ARN',
    });

    new CfnOutput(this, 'HealthCheckEndpoint', {
      value: `https://${restApiId}.execute-api.${this.region}.amazonaws.com/${environment}/call/health`,
      description: 'Health Check Endpoint URL (GET /call/health)',
    });

    new CfnOutput(this, 'UserLeftFnArn', {
      value: userLeftFn.functionArn,
      description: 'User Left Handler Lambda ARN',
    });

    new CfnOutput(this, 'UserLeftEndpoint', {
      value: `https://${restApiId}.execute-api.${this.region}.amazonaws.com/${environment}/call/{callId}/user-left`,
      description: 'User Left Endpoint URL (POST /call/{callId}/user-left)',
    });

    // ⚡ WARM POOL OUTPUTS
    new CfnOutput(this, 'BotAssignmentsQueueUrl', {
      value: botAssignmentsQueue.queueUrl,
      description: 'SQS Queue URL for bot call assignments (warm pool)',
    });

    new CfnOutput(this, 'BotAssignmentsDLQUrl', {
      value: botAssignmentsDLQ.queueUrl,
      description: 'Dead Letter Queue URL for failed bot assignments',
    });

    new CfnOutput(this, 'WarmPoolServiceName', {
      value: warmPoolService.serviceName,
      description: 'ECS Service name for warm bot pool',
    });

    new CfnOutput(this, 'WarmPoolServiceArn', {
      value: warmPoolService.serviceArn,
      description: 'ECS Service ARN for warm bot pool',
    });
  }
}
