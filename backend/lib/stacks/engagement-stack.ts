import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Stack, StackProps } from 'aws-cdk-lib';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface EngagementStackProps extends StackProps {
  environment: string;
  userActivityTable: TableV2;
  userStreaksTable: TableV2;
  usersTable: TableV2;
  agentsTable: TableV2;
  restApiId: string;
  rootResourceId: string;
  appSecret: Secret;
}

export class EngagementStack extends Stack {
  public readonly engagementHandler: NodejsFunction;

  constructor(scope: Construct, id: string, props: EngagementStackProps) {
    super(scope, id, props);

    const {
      environment,
      userActivityTable,
      userStreaksTable,
      usersTable,
      agentsTable,
      restApiId,
      rootResourceId,
      appSecret,
    } = props;

    // Import the API Gateway created in ApiGatewayStack
    const apiGateway = RestApi.fromRestApiAttributes(this, 'ImportedApi', {
      restApiId: restApiId,
      rootResourceId: rootResourceId,
    });

    // Engagement lambda handler
    this.engagementHandler = new NodejsFunction(
      this,
      `${id}-engagement-handler`,
      {
        functionName: `${id}-engagement-handler`,
        runtime: lambda.Runtime.NODEJS_22_X,
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        entry: 'src/services/engagement/api.ts',
        handler: 'default',
        bundling: {
          sourceMap: true,
          externalModules: ['aws-sdk'],
          preCompilation: false,
        },
        environment: {
          ENVIRONMENT: environment,
          APP_SECRET_NAME: appSecret.secretName,
          USER_ACTIVITY_TABLE_NAME: userActivityTable.tableName,
          USER_STREAKS_TABLE_NAME: userStreaksTable.tableName,
          USERS_TABLE_NAME: usersTable.tableName,
          AGENTS_TABLE_NAME: agentsTable.tableName,
        },
      }
    );

    // Grant permissions to the lambda function
    userActivityTable.grantReadWriteData(this.engagementHandler);
    userStreaksTable.grantReadWriteData(this.engagementHandler);
    usersTable.grantReadData(this.engagementHandler);
    agentsTable.grantReadData(this.engagementHandler);
    appSecret.grantRead(this.engagementHandler);

    // Grant API Gateway permissions to invoke the lambda function
    this.engagementHandler.addPermission(
      `EngagementHandler-ApiGatewayInvoke-${environment}`,
      {
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: apiGateway.arnForExecuteApi(),
      }
    );

    // Add resources to the API Gateway
    const engagementResource = apiGateway.root.addResource('engagement');

    // Activity endpoint: POST /engagement/activity
    const activityResource = engagementResource.addResource('activity');
    activityResource.addMethod('POST', new apigateway.LambdaIntegration(this.engagementHandler));

    // Recent endpoint: GET /engagement/recent
    const recentResource = engagementResource.addResource('recent');
    recentResource.addMethod('GET', new apigateway.LambdaIntegration(this.engagementHandler));

    // Streaks endpoint: GET /engagement/streaks
    const streaksResource = engagementResource.addResource('streaks');
    streaksResource.addMethod('GET', new apigateway.LambdaIntegration(this.engagementHandler));

    // Summary endpoint: GET /engagement/summary
    const summaryResource = engagementResource.addResource('summary');
    summaryResource.addMethod('GET', new apigateway.LambdaIntegration(this.engagementHandler));
  }
}
