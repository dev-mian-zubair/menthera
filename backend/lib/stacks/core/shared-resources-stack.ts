import { Stack, StackProps } from 'aws-cdk-lib';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class SharedResourcesStack extends Stack {
  public readonly filesBucket: Bucket;
  public readonly appSecret: Secret;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // S3 Bucket for files
    this.filesBucket = new Bucket(this, 'FilesBucket', {
      bucketName: `${id.toLowerCase()}-files`,
      encryption: BucketEncryption.S3_MANAGED,
      versioned: true,
      publicReadAccess: false,
    });

    // Create secret with key-value structure
    this.appSecret = new Secret(
      this,
      'MentheraSecret',
      {
        secretName: 'menthera-secret',
        description: 'Menthera application secrets',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            // Authentication
            CLERK_SECRET_KEY: 'REPLACE_WITH_ACTUAL_CLERK_SECRET_KEY',
            CLERK_PUBLISHABLE_KEY: 'REPLACE_WITH_ACTUAL_CLERK_PUBLISHABLE_KEY',

            // AI Services (Google keys come from user BYOK, not system secrets)
            ELEVENLABS_API_KEY: 'REPLACE_WITH_ACTUAL_ELEVENLABS_API_KEY',
            MEM0_API_KEY: 'REPLACE_WITH_ACTUAL_MEM0_API_KEY',

            // Communication & Voice
            DAILY_API_KEY: 'REPLACE_WITH_ACTUAL_DAILY_API_KEY',
            CARTESIA_API_KEY: 'REPLACE_WITH_ACTUAL_CARTESIA_API_KEY',

            // Optional AI Services (for future use)
            OPENAI_API_KEY: 'REPLACE_WITH_ACTUAL_OPENAI_API_KEY',
            ANTHROPIC_API_KEY: 'REPLACE_WITH_ACTUAL_ANTHROPIC_API_KEY',

            // Webhook secrets
            CLERK_WEBHOOK_SECRET: 'REPLACE_WITH_ACTUAL_CLERK_WEBHOOK_SECRET',
            REVENUECAT_WEBHOOK_SECRET: 'REPLACE_WITH_ACTUAL_REVENUECAT_WEBHOOK_SECRET',

          }),
          generateStringKey: 'password', // This will be ignored since we're using a template
        },
      },
    );
  }
}
