import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Stack, StackProps } from 'aws-cdk-lib';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface HistoryStackProps extends StackProps {
  environment: string;
  callsTable: TableV2;
  messagesTable: TableV2;
  usersTable: TableV2;
  agentsTable: TableV2;
  restApiId: string;
  rootResourceId: string;
  filesBucket: Bucket;
  appSecret: Secret;
}

export class HistoryStack extends Stack {
  constructor(scope: Construct, id: string, props: HistoryStackProps) {
    super(scope, id, props);

    const { environment, callsTable, messagesTable, usersTable, agentsTable, restApiId, rootResourceId, filesBucket, appSecret } = props;

    // Import the API Gateway created in ApiGatewayStack
    const apiGateway = RestApi.fromRestApiAttributes(this, 'ImportedApi', {
      restApiId: restApiId,
      rootResourceId: rootResourceId,
    });

    // History Lambda Function (unified calls + messages handler)
    const historyHandler = new NodejsFunction(
      this,
      `${id}-history-handler`,
      {
        functionName: `${id}-history-handler`,
        runtime: lambda.Runtime.NODEJS_22_X,
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        entry: 'src/services/history/api.ts',
        handler: 'default',
        bundling: {
          sourceMap: true,
          externalModules: ['aws-sdk'],
          preCompilation: false,
        },
        environment: {
          ENVIRONMENT: environment,
          CALLS_TABLE_NAME: callsTable.tableName,
          MESSAGES_TABLE_NAME: messagesTable.tableName,
          USERS_TABLE_NAME: usersTable.tableName,
          AGENTS_TABLE_NAME: agentsTable.tableName,
          APP_SECRET_NAME: appSecret.secretName,
        },
      }
    );

    // Grant permissions to the lambda function
    callsTable.grantReadWriteData(historyHandler);
    messagesTable.grantReadWriteData(historyHandler);
    usersTable.grantReadData(historyHandler);
    agentsTable.grantReadData(historyHandler);
    appSecret.grantRead(historyHandler);
    filesBucket.grantReadWrite(historyHandler);

    // Grant API Gateway permissions to invoke the lambda function
    historyHandler.addPermission(
      `HistoryHandler-ApiGatewayInvoke-${environment}`,
      {
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: apiGateway.arnForExecuteApi(),
      }
    );

    // Add CALLS API resources
    const callsResource = apiGateway.root.addResource('calls');

    // GET /calls/history - Get call history
    const callsHistoryResource = callsResource.addResource('history');
    callsHistoryResource.addMethod('GET', new apigateway.LambdaIntegration(historyHandler));

    // GET /calls/:callId - Get call details
    const callIdResource = callsResource.addResource('{callId}');
    callIdResource.addMethod('GET', new apigateway.LambdaIntegration(historyHandler));

    // Add MESSAGES API resources
    const messagesResource = apiGateway.root.addResource('messages');

    // GET /messages/:agentId - Get conversation with specific agent
    const agentIdResource = messagesResource.addResource('{agentId}');
    agentIdResource.addMethod('GET', new apigateway.LambdaIntegration(historyHandler));
  }
}
