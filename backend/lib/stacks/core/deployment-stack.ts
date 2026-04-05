import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { RestApi, Deployment, Stage, DomainName } from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface DeploymentStackProps extends StackProps {
  environment: string;
  restApiId: string;
  rootResourceId: string;
  apiCertificate?: Certificate;
  hostedZone?: HostedZone;
  domainName?: string;
}

export class DeploymentStack extends Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    const { environment, restApiId, rootResourceId, apiCertificate, hostedZone, domainName = 'example.com' } = props;

    // Import the API Gateway from ApiGatewayStack
    const apiGateway = RestApi.fromRestApiAttributes(this, 'ImportedApi', {
      restApiId: restApiId,
      rootResourceId: rootResourceId,
    });

    // Create the deployment (this depends on all service stacks that added methods to the API)
    const deployment = new Deployment(this, 'Deployment', {
      api: apiGateway,
      description: `Deployment for ${environment}`,
    });

    // Force new deployment on each CDK deploy to ensure stage always uses latest resources
    // This is a workaround for CDK not always detecting API Gateway resource changes
    // See: https://github.com/aws/aws-cdk/issues/25582
    deployment.addToLogicalId(Date.now());

    // Create the stage with caching disabled to ensure fresh responses
    // This ensures new resources added to the API are immediately available
    // without requiring manual cache invalidation
    const stage = new Stage(this, 'Stage', {
      deployment: deployment,
      stageName: environment,
      cacheClusterEnabled: false, // Disable caching - ensures fresh deployment always
    });

    // Custom domain setup: DomainName + BasePathMapping + A record
    // All in this stack to avoid cyclic dependencies (DomainName needs Stage reference)
    if (apiCertificate && hostedZone) {
      const apiSubdomain = environment === 'prod'
        ? `api.${domainName}`
        : `dev.api.${domainName}`;
      const apiRecordName = environment === 'prod' ? 'api' : 'dev.api';

      const apiDomain = new DomainName(this, 'ApiDomain', {
        domainName: apiSubdomain,
        certificate: apiCertificate,
      });

      apiDomain.addBasePathMapping(apiGateway, {
        basePath: '',
        stage: stage,
      });

      new ARecord(this, 'ApiRecord', {
        zone: hostedZone,
        recordName: apiRecordName,
        target: RecordTarget.fromAlias(new ApiGatewayDomain(apiDomain)),
      });
    }

    // Export the stage endpoint for reference
    new CfnOutput(this, 'ApiEndpoint', {
      value: `https://${restApiId}.execute-api.${this.region}.amazonaws.com/${environment}`,
      description: 'API Gateway endpoint URL',
      exportName: `${id}-ApiEndpoint`,
    });

    new CfnOutput(this, 'DeploymentId', {
      value: deployment.deploymentId,
      description: 'API Gateway Deployment ID',
      exportName: `${id}-DeploymentId`,
    });
  }
}
