import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

// Internal message type for database storage
interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * ChatHelpers service
 *
 * Provides utilities for saving chat messages to DynamoDB with proper
 * timestamp handling, token tracking, and error recovery.
 */
export class ChatHelpers {
  private db: DynamoDBDocumentClient;
  private messagesTableName: string;

  public static new({
    db,
    messagesTableName,
  }: {
    db: DynamoDBDocumentClient;
    messagesTableName: string;
  }): ChatHelpers {
    return new ChatHelpers({ db, messagesTableName });
  }

  private constructor({
    db,
    messagesTableName,
  }: {
    db: DynamoDBDocumentClient;
    messagesTableName: string;
  }) {
    this.db = db;
    this.messagesTableName = messagesTableName;
  }

  /**
   * Save a user message to DynamoDB
   *
   * @param props - User message properties
   * @returns The saved message
   */
  async saveUserMessage(props: {
    userId: string;
    agentId: string;
    content: string;
    timestamp?: number;
    timezone?: string;
  }): Promise<StoredMessage> {
    const messageId = randomUUID();
    const messageTimestamp = props.timestamp
      ? new Date(props.timestamp).toISOString()
      : new Date().toISOString();

    const message: StoredMessage = {
      id: messageId,
      role: 'user',
      content: props.content,
    };

    // Store to DynamoDB with composite sort key
    // Table keys: PK=user_id, SK=composite_key (agent_id#message_id)
    // Format: "agent123#msg-uuid" enables efficient agent-based queries and maintains uniqueness
    const compositeKey = `${props.agentId}#${messageId}`;

    await this.db.send(
      new PutCommand({
        TableName: this.messagesTableName,
        Item: {
          user_id: props.userId,           // Partition key
          composite_key: compositeKey,     // Sort key: agent_id#message_id
          message_id: messageId,           // Unique message identifier
          agent_id: props.agentId,         // Stored for querying/filtering
          content: props.content,
          role: 'user',
          timestamp: messageTimestamp,
          created_at: messageTimestamp,
          ...(props.timezone && { timezone: props.timezone }),
        },
      })
    );

    return message;
  }

  /**
   * Save an AI message with usage metrics
   *
   * @param props - AI message properties including streaming result
   * @returns The saved message
   */
  async saveAiMessage(props: {
    userId: string;
    agentId: string;
    content: string;
    result: {
      response: { timestamp: Date };
      usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
    };
    timezone?: string;
  }): Promise<StoredMessage> {
    const messageId = randomUUID();
    const responseTimestamp = props.result.response.timestamp;
    const usage = props.result.usage || {};

    const message: StoredMessage = {
      id: messageId,
      role: 'assistant',
      content: props.content,
    };

    // Store to DynamoDB with composite sort key
    // Table keys: PK=user_id, SK=composite_key (agent_id#message_id)
    // Format: "agent123#msg-uuid" enables efficient agent-based queries and maintains uniqueness
    const compositeKey = `${props.agentId}#${messageId}`;

    await this.db.send(
      new PutCommand({
        TableName: this.messagesTableName,
        Item: {
          user_id: props.userId,           // Partition key
          composite_key: compositeKey,     // Sort key: agent_id#message_id
          message_id: messageId,           // Unique message identifier
          agent_id: props.agentId,         // Stored for querying/filtering
          content: props.content,
          role: 'assistant',
          timestamp: responseTimestamp.toISOString(),
          created_at: responseTimestamp.toISOString(),
          tokens_input: usage.inputTokens || 0,
          tokens_output: usage.outputTokens || 0,
          tokens_total: usage.totalTokens || 0,
          ...(props.timezone && { timezone: props.timezone }),
        },
      })
    );

    return message;
  }

  /**
   * Save a report notification message
   * Used for quest completion notifications
   *
   * @param props - Report notification properties
   * @returns The saved message
   */
  async saveReportNotification(props: {
    userId: string;
    agentId: string;
    content: string;
    metadata: {
      questId: string;
      sessionId: string;
      title: string;
      shortDescription: string;
      icon?: string;
    };
  }): Promise<StoredMessage> {
    const messageId = randomUUID();
    const now = new Date().toISOString();

    const message: StoredMessage = {
      id: messageId,
      role: 'assistant',
      content: props.content,
    };

    const compositeKey = `${props.agentId}#${messageId}`;

    await this.db.send(
      new PutCommand({
        TableName: this.messagesTableName,
        Item: {
          user_id: props.userId,
          composite_key: compositeKey,
          message_id: messageId,
          agent_id: props.agentId,
          content: props.content,
          role: 'assistant',
          message_type: 'REPORT_NOTIFICATION', // Special type for frontend handling
          timestamp: now,
          created_at: now,
          // Metadata for report navigation
          quest_id: props.metadata.questId,
          session_id: props.metadata.sessionId,
          report_title: props.metadata.title,
          report_description: props.metadata.shortDescription,
          ...(props.metadata.icon && { report_icon: props.metadata.icon }),
        },
      })
    );

    return message;
  }

  /**
   * Save a partial AI message (error recovery)
   *
   * Saves whatever content was streamed before an error occurred.
   * Uses current timestamp and zero token counts since stream was incomplete.
   *
   * @param props - Partial message properties
   * @returns The saved message
   */
  async savePartialAiMessage(props: {
    userId: string;
    agentId: string;
    content: string;
    timezone?: string;
  }): Promise<StoredMessage> {
    const messageId = randomUUID();
    const now = new Date().toISOString();

    const message: StoredMessage = {
      id: messageId,
      role: 'assistant',
      content: props.content,
    };

    // Store to DynamoDB with composite sort key
    // Table keys: PK=user_id, SK=composite_key (agent_id#message_id)
    // Format: "agent123#msg-uuid" enables efficient agent-based queries and maintains uniqueness
    const compositeKey = `${props.agentId}#${messageId}`;

    await this.db.send(
      new PutCommand({
        TableName: this.messagesTableName,
        Item: {
          user_id: props.userId,           // Partition key
          composite_key: compositeKey,     // Sort key: agent_id#message_id
          message_id: messageId,           // Unique message identifier
          agent_id: props.agentId,         // Stored for querying/filtering
          content: props.content,
          role: 'assistant',
          timestamp: now,
          created_at: now,
          ...(props.timezone && { timezone: props.timezone }),
        },
      })
    );

    return message;
  }
}
