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

export interface AchievementsStackProps extends StackProps {
  environment: string;
  userAchievementsTable: TableV2;
  userActivityTable: TableV2;
  userStreaksTable: TableV2;
  messagesTable: TableV2;
  callsTable: TableV2;
  questSessionsTable: TableV2;
  restApiId: string;
  rootResourceId: string;
  appSecret: Secret;
}

export class AchievementsStack extends Stack {
  public readonly achievementsHandler: NodejsFunction;

  constructor(scope: Construct, id: string, props: AchievementsStackProps) {
    super(scope, id, props);

    const {
      environment,
      userAchievementsTable,
      userActivityTable,
      userStreaksTable,
      messagesTable,
      callsTable,
      questSessionsTable,
      restApiId,
      rootResourceId,
      appSecret,
    } = props;

    // Import the API Gateway created in ApiGatewayStack
    const apiGateway = RestApi.fromRestApiAttributes(this, 'ImportedApi', {
      restApiId: restApiId,
      rootResourceId: rootResourceId,
    });

    // Achievements lambda handler
    this.achievementsHandler = new NodejsFunction(
      this,
      `${id}-achievements-handler`,
      {
        functionName: `${id}-achievements-handler`,
        runtime: lambda.Runtime.NODEJS_22_X,
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        entry: 'src/services/achievements/api.ts',
        handler: 'default',
        bundling: {
          sourceMap: true,
          externalModules: ['aws-sdk'],
          preCompilation: false,
        },
        environment: {
          ENVIRONMENT: environment,
          APP_SECRET_NAME: appSecret.secretName,
          USER_ACHIEVEMENTS_TABLE_NAME: userAchievementsTable.tableName,
          USER_ACTIVITY_TABLE_NAME: userActivityTable.tableName,
          USER_STREAKS_TABLE_NAME: userStreaksTable.tableName,
          MESSAGES_TABLE_NAME: messagesTable.tableName,
          CALLS_TABLE_NAME: callsTable.tableName,
          QUEST_SESSIONS_TABLE_NAME: questSessionsTable.tableName,
        },
      }
    );

    // Grant permissions to the lambda function
    userAchievementsTable.grantReadWriteData(this.achievementsHandler);
    userActivityTable.grantReadData(this.achievementsHandler);
    userStreaksTable.grantReadData(this.achievementsHandler);
    messagesTable.grantReadData(this.achievementsHandler);
    callsTable.grantReadData(this.achievementsHandler);
    questSessionsTable.grantReadData(this.achievementsHandler);
    appSecret.grantRead(this.achievementsHandler);

    // Grant API Gateway permissions to invoke the lambda function
    this.achievementsHandler.addPermission(
      `AchievementsHandler-ApiGatewayInvoke-${environment}`,
      {
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: apiGateway.arnForExecuteApi(),
      }
    );

    // Add resources to the API Gateway
    const achievementsResource = apiGateway.root.addResource('achievements');

    // GET /achievements - Get all achievements with progress
    achievementsResource.addMethod('GET', new apigateway.LambdaIntegration(this.achievementsHandler));

    // POST /achievements/check - Check and unlock achievements
    const checkResource = achievementsResource.addResource('check');
    checkResource.addMethod('POST', new apigateway.LambdaIntegration(this.achievementsHandler));

    // GET /achievements/milestones - Get milestone progress
    const milestonesResource = achievementsResource.addResource('milestones');
    milestonesResource.addMethod('GET', new apigateway.LambdaIntegration(this.achievementsHandler));

    // GET /achievements/stats - Get user stats
    const statsResource = achievementsResource.addResource('stats');
    statsResource.addMethod('GET', new apigateway.LambdaIntegration(this.achievementsHandler));
  }
}
