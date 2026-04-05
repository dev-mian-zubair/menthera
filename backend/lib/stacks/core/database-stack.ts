import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { AppTableKeys } from '../../../src/shared/enum/table';

export interface DatabaseStackProps extends StackProps {
  environment: string;
}

export class DatabaseStack extends Stack {
  public readonly usersTable: TableV2;
  public readonly agentsTable: TableV2;
  public readonly messagesTable: TableV2;
  public readonly callsTable: TableV2;
  public readonly roomsTable: TableV2;
  public readonly chatProcessingJobsTable: TableV2;
  public readonly questSessionsTable: TableV2;
  public readonly questDefinitionsTable: TableV2;
  public readonly rateLimitsTable: TableV2;
  public readonly userActivityTable: TableV2;
  public readonly userStreaksTable: TableV2;
  public readonly userAchievementsTable: TableV2;
  public readonly subscriptionAuditTable: TableV2;
  public readonly webhookIdempotencyTable: TableV2;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // Determine environment-specific settings
    const isProduction = environment === 'prod';
    const removalPolicy = isProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
    const pointInTimeRecoverySpecification = isProduction ? { pointInTimeRecoveryEnabled: true } : undefined;

    // Helper function to generate table name with environment prefix
    const getTableName = (baseName: string): string => {
      return `${environment}-${baseName}`;
    };

    // Users Table
    this.usersTable = new TableV2(this, 'UsersTable', {
      tableName: getTableName(AppTableKeys.USERS),
      partitionKey: { name: 'user_id', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification,
      removalPolicy,
    });

    // Agents Table
    this.agentsTable = new TableV2(this, 'AgentsTable', {
      tableName: getTableName(AppTableKeys.AGENTS),
      partitionKey: { name: 'agent_id', type: AttributeType.STRING },
      sortKey: { name: 'agent_type', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification,
      removalPolicy,
    });

    // Messages Table
    // Partition key: user_id (query by user)
    // Sort key: composite_key (format: agent_id#message_id)
    // This enables efficient querying of messages by agent without FilterExpression
    // and maintains unique message IDs per user
    // Force DESTROY for dev to allow table replacement when schema changes
    this.messagesTable = new TableV2(this, 'MessagesTable', {
      tableName: getTableName(AppTableKeys.MESSAGES),
      partitionKey: { name: 'user_id', type: AttributeType.STRING },
      sortKey: { name: 'composite_key', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      timeToLiveAttribute: 'expiresAt',
      pointInTimeRecoverySpecification,
      removalPolicy: isProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      deletionProtection: isProduction,
    });

    // Calls Table
    this.callsTable = new TableV2(this, 'CallsTable', {
      tableName: getTableName(AppTableKeys.CALLS),
      partitionKey: { name: 'user_id', type: AttributeType.STRING },
      sortKey: { name: 'call_id', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification,
      removalPolicy,
    });

    // Rooms Table - One room per user-agent pair
    this.roomsTable = new TableV2(this, 'RoomsTable', {
      tableName: getTableName(AppTableKeys.ROOMS),
      partitionKey: { name: 'user_id', type: AttributeType.STRING },
      sortKey: { name: 'agent_id', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification,
      removalPolicy,
    });

    // Quest Definitions Table (STATIC)
    // Partition key: pk (format: QUEST#<quest_id>#v<version>)
    // Sort key: sk (format: METADATA | TASK#<task_id> | QUESTION#<task_id>#<question_id>)
    // Stores static quest definitions, tasks, and questions
    this.questDefinitionsTable = new TableV2(this, 'QuestDefinitionsTable', {
      tableName: getTableName(AppTableKeys.QUEST_DEFINITIONS),
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification,
      removalPolicy,
    });

    // Quest Sessions Table (USER EXECUTION)
    // Partition key: pk (format: USER#<user_id>)
    // Sort key: sk (format: AGENT#<agent_id>#SESSION#<session_id>[#<entity>])
    // Stores user quest execution data: sessions, answers, scores, insights
    this.questSessionsTable = new TableV2(this, 'QuestSessionsTable', {
      tableName: getTableName(AppTableKeys.QUEST_SESSIONS),
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification,
      removalPolicy,
    });

    // Rate Limits Table - Distributed rate limiting
    // Partition key: rate_limit_key (format: <keyPrefix>:<userId>)
    // TTL: Auto-expires entries after reset + 24h
    this.rateLimitsTable = new TableV2(this, 'RateLimitsTable', {
      tableName: getTableName('rate-limits'),
      partitionKey: { name: 'rate_limit_key', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      timeToLiveAttribute: 'ttl',
      removalPolicy,
    });

    // User Activity Table - Tracks all user activities for engagement features
    // Partition key: user_id
    // Sort key: timestamp (ISO format for chronological sorting)
    // TTL: Auto-expires entries after 90 days
    this.userActivityTable = new TableV2(this, 'UserActivityTable', {
      tableName: getTableName(AppTableKeys.USER_ACTIVITY),
      partitionKey: { name: 'user_id', type: AttributeType.STRING },
      sortKey: { name: 'timestamp', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      timeToLiveAttribute: 'ttl',
      pointInTimeRecoverySpecification,
      removalPolicy,
    });

    // Add GSI for querying activities by agent
    this.userActivityTable.addGlobalSecondaryIndex({
      indexName: 'agent-timestamp-index',
      partitionKey: { name: 'agent_id', type: AttributeType.STRING },
      sortKey: { name: 'timestamp', type: AttributeType.STRING },
    });

    // User Streaks Table - Tracks consecutive engagement days
    // Partition key: user_id
    // Sort key: streak_type (e.g., 'daily', 'agent#<agentId>')
    this.userStreaksTable = new TableV2(this, 'UserStreaksTable', {
      tableName: getTableName(AppTableKeys.USER_STREAKS),
      partitionKey: { name: 'user_id', type: AttributeType.STRING },
      sortKey: { name: 'streak_type', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification,
      removalPolicy,
    });

    // Subscription Audit Table - Tracks all subscription lifecycle events
    // Partition key: user_id
    // Sort key: timestamp (ISO format for chronological sorting)
    // Stores: event type, old/new plan, product ID, source (revenuecat/clerk)
    this.subscriptionAuditTable = new TableV2(this, 'SubscriptionAuditTable', {
      tableName: getTableName(AppTableKeys.SUBSCRIPTION_AUDIT),
      partitionKey: { name: 'user_id', type: AttributeType.STRING },
      sortKey: { name: 'timestamp', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification,
      removalPolicy,
    });

    // Webhook Idempotency Table - Prevents duplicate webhook processing
    // Partition key: idempotency_key (format: <source>:<event_id> or hash of event)
    // TTL: Auto-expires entries after 24 hours
    this.webhookIdempotencyTable = new TableV2(this, 'WebhookIdempotencyTable', {
      tableName: getTableName(AppTableKeys.WEBHOOK_IDEMPOTENCY),
      partitionKey: { name: 'idempotency_key', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      timeToLiveAttribute: 'ttl',
      removalPolicy,
    });

    // User Achievements Table - Tracks unlocked achievements and progress
    // Partition key: user_id
    // Sort key: achievement_id (e.g., 'first_message', 'streak_7', 'voice_master')
    this.userAchievementsTable = new TableV2(this, 'UserAchievementsTable', {
      tableName: getTableName(AppTableKeys.USER_ACHIEVEMENTS),
      partitionKey: { name: 'user_id', type: AttributeType.STRING },
      sortKey: { name: 'achievement_id', type: AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      pointInTimeRecoverySpecification,
      removalPolicy,
    });
  }
}
