import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { RestApi, Cors, MethodOptions } from 'aws-cdk-lib/aws-apigateway';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ApiGatewayStackProps extends StackProps {
  environment: string;
}

export class ApiGatewayStack extends Stack {
  public readonly apiGateway: RestApi;
  public readonly logGroup: LogGroup;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const { environment } = props;
    const isProduction = environment === 'prod';

    // Resolve allowed CORS origins from environment. Fail closed always:
    // the stack will refuse to synth if ALLOWED_ORIGINS is unset, for any
    // environment, preventing an accidental wide-open deploy. See README for
    // how to configure this for local development and deployments.
    const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (allowedOrigins.length === 0) {
      throw new Error(
        'ALLOWED_ORIGINS env var must be set. ' +
        'Provide a comma-separated list of allowed origin URLs ' +
        '(e.g. "https://app.example.com,https://admin.example.com"). ' +
        'See README for configuration details.'
      );
    }

    // Create CloudWatch Log Group for API Gateway
    this.logGroup = new LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/menthera-${environment}`,
      retention: isProduction ? RetentionDays.THREE_MONTHS : RetentionDays.ONE_WEEK,
      removalPolicy: 'destroy' as any,
    });

    // Create the main API Gateway with deploy: false to avoid circular dependencies
    // Deployment will be handled by a separate DeploymentStack that depends on all service stacks
    this.apiGateway = new RestApi(this, 'MentheraApi', {
      restApiName: `menthera-${environment}-api`,
      description: 'Menthera Backend API',
      defaultCorsPreflightOptions: {
        allowOrigins: allowedOrigins,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
      deploy: false, // Critical: Prevents automatic deployment, breaks circular dependencies
    });

    // Export the API Gateway IDs so service stacks can import and add resources to it
    new CfnOutput(this, 'RestApiId', {
      value: this.apiGateway.restApiId,
      description: 'REST API ID',
      exportName: `${id}-RestApiId`,
    });

    new CfnOutput(this, 'RootResourceId', {
      value: this.apiGateway.root.resourceId,
      description: 'Root Resource ID',
      exportName: `${id}-RootResourceId`,
    });

    // Note: LogGroup is created but not exported - it's internal to the stack
    // The logGroup property is available to other stacks via the public property
  }
}
