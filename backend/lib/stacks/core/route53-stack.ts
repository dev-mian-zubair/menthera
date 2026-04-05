import { Stack, StackProps, CfnOutput, Fn } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { FunctionUrlOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface Route53StackProps extends StackProps {
  environment: string;
  messageFunctionUrl: lambda.FunctionUrl;
  domainName?: string;
}

export class Route53Stack extends Stack {
  public readonly hostedZone: HostedZone;
  public readonly apiCertificate: Certificate;
  public readonly chatDistribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: Route53StackProps) {
    super(scope, id, props);

    const { environment, messageFunctionUrl, domainName = 'example.com' } = props;

    // Determine subdomains based on environment
    const apiSubdomain = environment === 'prod'
      ? `api.${domainName}`
      : `dev.api.${domainName}`;
    const chatSubdomain = environment === 'prod'
      ? `chat.${domainName}`
      : `dev.chat.${domainName}`;
    const chatRecordName = environment === 'prod' ? 'chat' : 'dev.chat';

    // Create the hosted zone for the configured domain
    this.hostedZone = new HostedZone(this, 'MentheraHostedZone', {
      zoneName: domainName,
    });

    // hostedZoneNameServers is a CDK list token — use Fn.join instead of JS .join()
    new CfnOutput(this, 'HostedZoneNameServers', {
      value: this.hostedZone.hostedZoneNameServers
        ? Fn.join(', ', this.hostedZone.hostedZoneNameServers)
        : '',
      description: 'Route53 Nameservers - Add these to your domain registrar DNS settings',
      exportName: `${id}-NameServers`,
    });

    new CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
      exportName: `${id}-HostedZoneId`,
    });

    // --- Certificates ---

    this.apiCertificate = new Certificate(this, 'ApiCertificate', {
      domainName: apiSubdomain,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });

    const chatCertificate = new Certificate(this, 'ChatCertificate', {
      domainName: chatSubdomain,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });

    // --- CloudFront Distribution for Chat (Lambda Function URL streaming) ---

    this.chatDistribution = new cloudfront.Distribution(this, 'ChatDistribution', {
      defaultBehavior: {
        origin: FunctionUrlOrigin.withOriginAccessControl(messageFunctionUrl),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      },
      domainNames: [chatSubdomain],
      certificate: chatCertificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // A record → CloudFront
    new ARecord(this, 'ChatRecord', {
      zone: this.hostedZone,
      recordName: chatRecordName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.chatDistribution)),
    });

    new CfnOutput(this, 'ApiDomainUrl', {
      value: `https://${apiSubdomain}`,
      description: `API Gateway Custom Domain URL (${environment})`,
      exportName: `${id}-ApiDomainUrl`,
    });

    new CfnOutput(this, 'ChatDomainUrl', {
      value: `https://${chatSubdomain}`,
      description: `Chat CloudFront Domain URL (${environment})`,
      exportName: `${id}-ChatDomainUrl`,
    });

    new CfnOutput(this, 'ChatDistributionId', {
      value: this.chatDistribution.distributionId,
      description: 'CloudFront Distribution ID (for cache invalidation)',
      exportName: `${id}-ChatDistributionId`,
    });
  }
}
