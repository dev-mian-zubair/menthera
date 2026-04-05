import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { createHash } from 'crypto';

export interface AuditEntry {
  userId: string;
  eventType: string;
  source: 'revenuecat' | 'clerk';
  oldPlan?: string;
  newPlan?: string;
  productId?: string;
  subscriptionStatus?: string;
  rawEvent?: Record<string, any>;
}

/**
 * Logs subscription lifecycle events to the audit table.
 * Every plan change, renewal, cancellation, etc. gets a permanent record.
 */
export async function logSubscriptionAudit(
  db: DynamoDBDocumentClient,
  entry: AuditEntry
): Promise<void> {
  const tableName = process.env.SUBSCRIPTION_AUDIT_TABLE_NAME;
  if (!tableName) {
    console.warn('[AUDIT] SUBSCRIPTION_AUDIT_TABLE_NAME not set, skipping audit log');
    return;
  }

  const now = new Date().toISOString();

  try {
    await db.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          user_id: entry.userId,
          timestamp: now,
          eventType: entry.eventType,
          source: entry.source,
          ...(entry.oldPlan && { oldPlan: entry.oldPlan }),
          ...(entry.newPlan && { newPlan: entry.newPlan }),
          ...(entry.productId && { productId: entry.productId }),
          ...(entry.subscriptionStatus && { subscriptionStatus: entry.subscriptionStatus }),
          // Store a summary of the raw event (exclude sensitive fields)
          ...(entry.rawEvent && {
            eventSummary: {
              type: entry.rawEvent.event?.type,
              product_id: entry.rawEvent.event?.product_id,
              expiration_at_ms: entry.rawEvent.event?.expiration_at_ms,
              environment: entry.rawEvent.event?.environment,
            },
          }),
        },
      })
    );

    console.log(`[AUDIT] ✓ Logged ${entry.eventType} for user ${entry.userId}`);
  } catch (error) {
    // Audit logging should never block the main flow
    console.error(`[AUDIT] ✗ Failed to log ${entry.eventType} for user ${entry.userId}:`, error);
  }
}

/**
 * Generates an idempotency key from a webhook event.
 * Uses event ID if available, otherwise hashes key fields.
 */
export function generateIdempotencyKey(source: string, event: any): string {
  // RevenueCat provides event.event.id
  const eventId = event.event?.id || event.id;
  if (eventId) {
    return `${source}:${eventId}`;
  }

  // Fallback: hash of key fields
  const hashInput = JSON.stringify({
    source,
    type: event.event?.type || event.type,
    userId: event.event?.app_user_id || event.data?.id,
    timestamp: event.event?.event_timestamp_ms || event.data?.created_at,
  });

  const hash = createHash('sha256').update(hashInput).digest('hex').substring(0, 32);
  return `${source}:${hash}`;
}

/**
 * Checks if a webhook event has already been processed.
 * Returns true if the event should be skipped (already processed).
 */
export async function checkIdempotency(
  db: DynamoDBDocumentClient,
  idempotencyKey: string
): Promise<boolean> {
  const tableName = process.env.WEBHOOK_IDEMPOTENCY_TABLE_NAME;
  if (!tableName) {
    console.warn('[IDEMPOTENCY] WEBHOOK_IDEMPOTENCY_TABLE_NAME not set, skipping check');
    return false;
  }

  try {
    const result = await db.send(
      new GetCommand({
        TableName: tableName,
        Key: { idempotency_key: idempotencyKey },
      })
    );

    if (result.Item) {
      console.log(`[IDEMPOTENCY] Event ${idempotencyKey} already processed at ${result.Item.processedAt}`);
      return true;
    }

    return false;
  } catch (error) {
    // If idempotency check fails, allow processing (fail open)
    console.error(`[IDEMPOTENCY] ✗ Check failed for ${idempotencyKey}:`, error);
    return false;
  }
}

/**
 * Marks a webhook event as processed with a 24-hour TTL.
 */
export async function markAsProcessed(
  db: DynamoDBDocumentClient,
  idempotencyKey: string,
  result: string
): Promise<void> {
  const tableName = process.env.WEBHOOK_IDEMPOTENCY_TABLE_NAME;
  if (!tableName) return;

  try {
    const ttl = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

    await db.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          idempotency_key: idempotencyKey,
          processedAt: new Date().toISOString(),
          result,
          ttl,
        },
      })
    );
  } catch (error) {
    console.error(`[IDEMPOTENCY] ✗ Failed to mark ${idempotencyKey} as processed:`, error);
  }
}
