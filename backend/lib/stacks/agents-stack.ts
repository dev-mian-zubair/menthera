import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Stack, StackProps } from 'aws-cdk-lib';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export interface AgentsStackProps extends StackProps {
  environment: string;
  agentsTable: TableV2;
  questSessionsTable: TableV2;
  questDefinitionsTable: TableV2;
  usersTable: TableV2;
  restApiId: string;
  rootResourceId: string;
  appSecret: Secret;
}

export class AgentsStack extends Stack {
  public readonly agentsHandler: NodejsFunction;

  constructor(scope: Construct, id: string, props: AgentsStackProps) {
    super(scope, id, props);

    const { environment, agentsTable, questSessionsTable, questDefinitionsTable, usersTable, restApiId, rootResourceId, appSecret } = props;

    // Import the API Gateway created in ApiGatewayStack
    const apiGateway = RestApi.fromRestApiAttributes(this, 'ImportedApi', {
      restApiId: restApiId,
      rootResourceId: rootResourceId,
    });

    // Agents lambda
    this.agentsHandler = new NodejsFunction(
      this,
      `${id}-agents-handler`,
      {
        functionName: `${id}-agents-handler`,
        runtime: lambda.Runtime.NODEJS_22_X,
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        entry: 'src/services/agents/api.ts',
        handler: 'handler',
        bundling: {
          sourceMap: true,
          externalModules: ['aws-sdk'],
          preCompilation: false,
        },
        environment: {
          ENVIRONMENT: environment,
          APP_SECRET_NAME: appSecret.secretName,
          AGENTS_TABLE_NAME: agentsTable.tableName,
          QUEST_SESSIONS_TABLE_NAME: questSessionsTable.tableName,
          QUEST_DEFINITIONS_TABLE_NAME: questDefinitionsTable.tableName,
          USERS_TABLE_NAME: usersTable.tableName,
        },
      }
    );

    // Grant permissions to the lambda function
    agentsTable.grantReadWriteData(this.agentsHandler);
    questSessionsTable.grantReadData(this.agentsHandler);
    questDefinitionsTable.grantReadData(this.agentsHandler);
    usersTable.grantReadData(this.agentsHandler);
    appSecret.grantRead(this.agentsHandler);

    // Grant API Gateway permissions to invoke the lambda function
    this.agentsHandler.addPermission(
      `AgentsHandler-ApiGatewayInvoke-${environment}`,
      {
        principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        sourceArn: apiGateway.arnForExecuteApi(),
      }
    );

    // Add resources to the API Gateway
    const agentsResource = apiGateway.root.addResource('agents');

    // Add GET method to fetch all agents
    agentsResource.addMethod('GET', new apigateway.LambdaIntegration(this.agentsHandler));
  }
}
