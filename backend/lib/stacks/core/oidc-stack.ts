import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

const GITHUB_OIDC_ISSUER = 'token.actions.githubusercontent.com';
const GITHUB_OIDC_THUMBPRINT = '6938fd4d98bab03faadb97b34396831e3780aea1';
const GITHUB_REPO = 'dev-mian-zubair/Menthera-Backend';

export interface OidcStackProps extends StackProps {
  environment: string;
}

export class OidcStack extends Stack {
  public readonly roleArn: string;

  constructor(scope: Construct, id: string, props: OidcStackProps) {
    super(scope, id, props);

    const { environment } = props;

    const oidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: `https://${GITHUB_OIDC_ISSUER}`,
      clientIds: ['sts.amazonaws.com'],
      thumbprints: [GITHUB_OIDC_THUMBPRINT],
    });

    // Dev: any branch/PR/tag. Prod: main branch only.
    const subCondition =
      environment === 'prod'
        ? `repo:${GITHUB_REPO}:ref:refs/heads/master`
        : `repo:${GITHUB_REPO}:*`;

    const role = new iam.Role(this, 'GitHubActionsRole', {
      roleName: `menthera-github-actions-${environment}`,
      maxSessionDuration: Duration.hours(1),
      assumedBy: new iam.FederatedPrincipal(
        oidcProvider.openIdConnectProviderArn,
        {
          StringLike: {
            [`${GITHUB_OIDC_ISSUER}:sub`]: subCondition,
          },
          StringEquals: {
            [`${GITHUB_OIDC_ISSUER}:aud`]: 'sts.amazonaws.com',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
      ],
    });

    this.roleArn = role.roleArn;

    new CfnOutput(this, 'GitHubActionsRoleArn', {
      value: role.roleArn,
      description: 'ARN of the IAM role for GitHub Actions OIDC',
      exportName: `menthera-github-actions-role-arn-${environment}`,
    });
  }
}
