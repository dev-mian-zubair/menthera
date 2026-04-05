import { SQSEvent, SQSBatchResponse, SQSRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getQuotaForPlan } from '../../shared/config/quotas.config';
import {
  logSubscriptionAudit,
  generateIdempotencyKey,
  checkIdempotency,
  markAsProcessed,
} from '../../shared/utils/audit-logger';

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE_NAME || 'users';

/**
 * SQS handler for processing webhook events asynchronously.
 * Returns batchItemFailures so only failed messages are retried (not the whole batch).
 */
export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  console.log(`[WEBHOOK-PROCESSOR] Processing ${event.Records.length} messages`);

  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error(`[WEBHOOK-PROCESSOR] Failed record ${record.messageId}:`, error);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};

async function processRecord(record: SQSRecord): Promise<void> {
  let message: { source: string; event: any };

  try {
    message = JSON.parse(record.body);
  } catch (error) {
    console.error('[WEBHOOK-PROCESSOR] Failed to parse message body:', error);
    // Don't throw - malformed messages should not be retried
    return;
  }

  const { source, event: webhookEvent } = message;
  const idempotencyKey = generateIdempotencyKey(source, webhookEvent);

  // Check idempotency - skip if already processed
  const alreadyProcessed = await checkIdempotency(db, idempotencyKey);
  if (alreadyProcessed) {
    console.log(`[WEBHOOK-PROCESSOR] Skipping duplicate event: ${idempotencyKey}`);
    return;
  }

  try {
    if (source === 'revenuecat') {
      await processRevenueCatEvent(webhookEvent);
    } else if (source === 'clerk') {
      // Clerk events are still processed synchronously in the main handler
      // since user creation needs to happen before any other operations
      console.log(`[WEBHOOK-PROCESSOR] Clerk events processed in main handler, skipping`);
    }

    await markAsProcessed(db, idempotencyKey, 'success');
  } catch (error) {
    console.error(`[WEBHOOK-PROCESSOR] Failed to process ${idempotencyKey}:`, error);
    // Throw to trigger SQS retry
    throw error;
  }
}

// ============================================
// REVENUECAT EVENT PROCESSORS
// ============================================

async function processRevenueCatEvent(event: any): Promise<void> {
  const eventType = event.event?.type;

  switch (eventType) {
    case 'INITIAL_PURCHASE':
      return await processInitialPurchase(event);
    case 'RENEWAL':
      return await processRenewal(event);
    case 'CANCELLATION':
      return await processCancellation(event);
    case 'EXPIRATION':
      return await processExpiration(event);
    case 'PRODUCT_CHANGE':
      return await processProductChange(event);
    case 'BILLING_ISSUE':
      return await processBillingIssue(event);
    default:
      console.log(`[WEBHOOK-PROCESSOR] Event type '${eventType}' not handled`);
  }
}

function extractUserId(event: any): string | null {
  const appUserId = event.event?.app_user_id;
  const originalAppUserId = event.event?.original_app_user_id;
  const aliases = event.event?.aliases;

  if (appUserId && typeof appUserId === 'string' && appUserId.trim() !== '') return appUserId;
  if (originalAppUserId && typeof originalAppUserId === 'string' && originalAppUserId.trim() !== '') return originalAppUserId;
  if (Array.isArray(aliases) && aliases.length > 0 && typeof aliases[0] === 'string') return aliases[0];

  return null;
}

function getProductTier(productId: string): 'inactive' | 'byok' {
  const productLower = productId.toLowerCase();
  if (productLower.includes('byok')) return 'byok';
  // Legacy pro/premium products map to inactive during transition
  return 'inactive';
}

function getUsageLimits(plan: 'inactive' | 'byok') {
  const quota = getQuotaForPlan(plan);
  return { totalMinutes: quota.minutes, totalMessages: quota.messages };
}

/**
 * Fetches the user's current plan before a change, for audit logging.
 */
async function getCurrentPlan(userId: string): Promise<string | undefined> {
  try {
    const result = await db.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { user_id: userId },
        ProjectionExpression: '#plan',
        ExpressionAttributeNames: { '#plan': 'plan' },
      })
    );
    return result.Item?.plan;
  } catch {
    return undefined;
  }
}

async function processInitialPurchase(event: any): Promise<void> {
  const userId = extractUserId(event);
  const productId = event.event?.product_id;
  const expiresDate = event.event?.expiration_at_ms;

  if (!userId || !productId) {
    console.error('[WEBHOOK-PROCESSOR] INITIAL_PURCHASE: Missing userId or productId');
    return;
  }

  const oldPlan = await getCurrentPlan(userId);
  const plan = getProductTier(productId);
  const limits = getUsageLimits(plan);

  await db.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { user_id: userId },
      UpdateExpression: `
        SET #plan = :plan,
            totalMinutes = :totalMinutes,
            totalMessages = :totalMessages,
            subscriptionStatus = :status,
            subscriptionProductId = :productId,
            subscriptionExpiresAt = :expiresAt,
            lastUpdated = :now
      `,
      ExpressionAttributeNames: { '#plan': 'plan' },
      ExpressionAttributeValues: {
        ':plan': plan,
        ':totalMinutes': limits.totalMinutes,
        ':totalMessages': limits.totalMessages,
        ':status': 'active',
        ':productId': productId,
        ':expiresAt': expiresDate ? new Date(expiresDate).toISOString() : null,
        ':now': new Date().toISOString(),
      },
    })
  );

  await logSubscriptionAudit(db, {
    userId,
    eventType: 'INITIAL_PURCHASE',
    source: 'revenuecat',
    oldPlan: oldPlan || 'unknown',
    newPlan: plan,
    productId,
    subscriptionStatus: 'active',
    rawEvent: event,
  });

  console.log(`[WEBHOOK-PROCESSOR] ✓ INITIAL_PURCHASE: ${userId} → ${plan}`);
}

async function processRenewal(event: any): Promise<void> {
  const userId = extractUserId(event);
  const productId = event.event?.product_id;
  const expiresDate = event.event?.expiration_at_ms;

  if (!userId) {
    console.error('[WEBHOOK-PROCESSOR] RENEWAL: Missing userId');
    return;
  }

  await db.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { user_id: userId },
      UpdateExpression: `
        SET subscriptionStatus = :status,
            subscriptionExpiresAt = :expiresAt,
            lastUpdated = :now
      `,
      ExpressionAttributeValues: {
        ':status': 'active',
        ':expiresAt': expiresDate ? new Date(expiresDate).toISOString() : null,
        ':now': new Date().toISOString(),
      },
    })
  );

  await logSubscriptionAudit(db, {
    userId,
    eventType: 'RENEWAL',
    source: 'revenuecat',
    productId,
    subscriptionStatus: 'active',
    rawEvent: event,
  });

  console.log(`[WEBHOOK-PROCESSOR] ✓ RENEWAL: ${userId}`);
}

async function processCancellation(event: any): Promise<void> {
  const userId = extractUserId(event);
  const expiresDate = event.event?.expiration_at_ms;

  if (!userId) {
    console.error('[WEBHOOK-PROCESSOR] CANCELLATION: Missing userId');
    return;
  }

  const currentPlan = await getCurrentPlan(userId);

  await db.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { user_id: userId },
      UpdateExpression: `
        SET subscriptionStatus = :status,
            subscriptionExpiresAt = :expiresAt,
            lastUpdated = :now
      `,
      ExpressionAttributeValues: {
        ':status': 'cancelled',
        ':expiresAt': expiresDate ? new Date(expiresDate).toISOString() : null,
        ':now': new Date().toISOString(),
      },
    })
  );

  await logSubscriptionAudit(db, {
    userId,
    eventType: 'CANCELLATION',
    source: 'revenuecat',
    oldPlan: currentPlan,
    subscriptionStatus: 'cancelled',
    rawEvent: event,
  });

  console.log(`[WEBHOOK-PROCESSOR] ✓ CANCELLATION: ${userId}`);
}

async function processExpiration(event: any): Promise<void> {
  const userId = extractUserId(event);

  if (!userId) {
    console.error('[WEBHOOK-PROCESSOR] EXPIRATION: Missing userId');
    return;
  }

  const oldPlan = await getCurrentPlan(userId);
  const limits = getUsageLimits('inactive');

  await db.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { user_id: userId },
      UpdateExpression: `
        SET #plan = :plan,
            totalMinutes = :totalMinutes,
            totalMessages = :totalMessages,
            subscriptionStatus = :status,
            subscriptionExpiresAt = :expiresAt,
            lastUpdated = :now
      `,
      ExpressionAttributeNames: { '#plan': 'plan' },
      ExpressionAttributeValues: {
        ':plan': 'inactive',
        ':totalMinutes': limits.totalMinutes,
        ':totalMessages': limits.totalMessages,
        ':status': 'expired',
        ':expiresAt': null,
        ':now': new Date().toISOString(),
      },
    })
  );

  await logSubscriptionAudit(db, {
    userId,
    eventType: 'EXPIRATION',
    source: 'revenuecat',
    oldPlan: oldPlan || 'unknown',
    newPlan: 'inactive',
    subscriptionStatus: 'expired',
    rawEvent: event,
  });

  console.log(`[WEBHOOK-PROCESSOR] ✓ EXPIRATION: ${userId} → inactive`);
}

async function processProductChange(event: any): Promise<void> {
  const userId = extractUserId(event);
  const newProductId = event.event?.new_product_id;
  const expiresDate = event.event?.expiration_at_ms;

  if (!userId || !newProductId) {
    console.error('[WEBHOOK-PROCESSOR] PRODUCT_CHANGE: Missing userId or newProductId');
    return;
  }

  const oldPlan = await getCurrentPlan(userId);
  const plan = getProductTier(newProductId);
  const limits = getUsageLimits(plan);

  await db.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { user_id: userId },
      UpdateExpression: `
        SET #plan = :plan,
            totalMinutes = :totalMinutes,
            totalMessages = :totalMessages,
            subscriptionStatus = :status,
            subscriptionProductId = :productId,
            subscriptionExpiresAt = :expiresAt,
            lastUpdated = :now
      `,
      ExpressionAttributeNames: { '#plan': 'plan' },
      ExpressionAttributeValues: {
        ':plan': plan,
        ':totalMinutes': limits.totalMinutes,
        ':totalMessages': limits.totalMessages,
        ':status': 'active',
        ':productId': newProductId,
        ':expiresAt': expiresDate ? new Date(expiresDate).toISOString() : null,
        ':now': new Date().toISOString(),
      },
    })
  );

  await logSubscriptionAudit(db, {
    userId,
    eventType: 'PRODUCT_CHANGE',
    source: 'revenuecat',
    oldPlan: oldPlan || 'unknown',
    newPlan: plan,
    productId: newProductId,
    subscriptionStatus: 'active',
    rawEvent: event,
  });

  console.log(`[WEBHOOK-PROCESSOR] ✓ PRODUCT_CHANGE: ${userId} → ${plan}`);
}

async function processBillingIssue(event: any): Promise<void> {
  const userId = extractUserId(event);

  if (!userId) {
    console.error('[WEBHOOK-PROCESSOR] BILLING_ISSUE: Missing userId');
    return;
  }

  const currentPlan = await getCurrentPlan(userId);

  await db.send(
    new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { user_id: userId },
      UpdateExpression: `
        SET subscriptionStatus = :status,
            lastUpdated = :now
      `,
      ExpressionAttributeValues: {
        ':status': 'billing_issue',
        ':now': new Date().toISOString(),
      },
    })
  );

  await logSubscriptionAudit(db, {
    userId,
    eventType: 'BILLING_ISSUE',
    source: 'revenuecat',
    oldPlan: currentPlan,
    subscriptionStatus: 'billing_issue',
    rawEvent: event,
  });

  console.log(`[WEBHOOK-PROCESSOR] ✓ BILLING_ISSUE: ${userId}`);
}
