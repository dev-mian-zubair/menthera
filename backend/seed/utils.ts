/**
 * Seed Utilities
 * Helper functions for database seeding operations
 */

import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SEED_CONFIG } from './config';

/**
 * Initialize DynamoDB client
 */
export function initializeClient() {
  const client = new DynamoDBClient({
    region: SEED_CONFIG.region,
  });
  const docClient = DynamoDBDocumentClient.from(client);
  // Attach raw client for DescribeTable operations
  (docClient as any)._client = client;
  return docClient;
}

/**
 * Check if table exists
 */
export async function checkTableExists(
  db: DynamoDBDocumentClient,
  tableName: string
): Promise<boolean> {
  try {
    const client = (db as any)._client as DynamoDBClient;
    await client.send(
      new DescribeTableCommand({
        TableName: tableName,
      })
    );
    return true;
  } catch (error: any) {
    console.error(`DynamoDB API Error Details:`, {
      name: error.name,
      code: error.code,
      message: error.message,
      statusCode: error.$metadata?.httpStatusCode,
    });

    if (error.name === 'ResourceNotFoundException' || error.code === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

/**
 * Clear table data
 */
export async function clearTable(
  db: DynamoDBDocumentClient,
  tableName: string,
  partitionKey: string,
  sortKey?: string
): Promise<number> {
  try {
    const result = await db.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    const items = result.Items || [];
    let deletedCount = 0;

    // Dynamic import DeleteCommand only when needed
    const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');

    for (const item of items) {
      const key: any = {
        [partitionKey]: item[partitionKey],
      };
      if (sortKey) {
        key[sortKey] = item[sortKey];
      }

      await db.send(
        new DeleteCommand({
          TableName: tableName,
          Key: key,
        })
      );
      deletedCount++;
    }

    return deletedCount;
  } catch (error) {
    console.error(`Error clearing table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Insert item into table
 */
export async function insertItem(
  db: DynamoDBDocumentClient,
  tableName: string,
  item: any
): Promise<void> {
  await db.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        ...item,
        createdAt: new Date().toISOString(),
      },
    })
  );
}

/**
 * Batch insert items
 */
export async function batchInsert(
  db: DynamoDBDocumentClient,
  tableName: string,
  items: any[]
): Promise<number> {
  let insertedCount = 0;

  for (const item of items) {
    try {
      await insertItem(db, tableName, item);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting item:`, error);
      throw error;
    }
  }

  return insertedCount;
}

/**
 * Log operation result
 */
export function logResult(
  operation: string,
  tableName: string,
  count: number,
  duration: number
): void {
  console.log(
    `✅ ${operation} - ${tableName}: ${count} item(s) - ${duration.toFixed(2)}ms`
  );
}

/**
 * Log error
 */
export function logError(message: string, error: any): void {
  console.error(`❌ ${message}:`, error.message || error);
}

/**
 * Log section header
 */
export function logHeader(text: string): void {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${text}`);
  console.log('='.repeat(60) + '\n');
}
