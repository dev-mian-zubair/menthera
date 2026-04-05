import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { handle } from 'hono/aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { getAuth } from '@hono/clerk-auth';
import customClerkMiddleware from '../../shared/auth-middleware';
import {
  buildHonoSuccess,
  buildHonoUnauthorized,
  buildHonoNotFound,
  buildHonoBadRequest,
  buildHonoErrorResponse,
} from '../../shared/utils/response-builder';

const app = new Hono();

app.use(logger());
app.use('*', customClerkMiddleware);
app.use('*', cors());

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

/**
 * GET /calls/history - Fetch user's call history
 * Returns calls sorted by timestamp (most recent first)
 * Supports pagination with offset and limit
 */
app.get('/calls/history', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;
    console.log(`[HISTORY] Query for user: ${userId}`);

    // Parse pagination parameters
    const offset = parseInt(c.req.query('offset') || '0');
    const limit = parseInt(c.req.query('limit') || '20');
    console.log(`[HISTORY] Pagination - offset: ${offset}, limit: ${limit}`);

    if (offset < 0 || limit < 1 || limit > 100) {
      return buildHonoBadRequest(c, 'Invalid pagination parameters. offset >= 0, 1 <= limit <= 100');
    }

    // Query calls for the user, sorted by call_id descending
    const tableName = process.env.CALLS_TABLE_NAME || 'calls';
    console.log(`[HISTORY] Querying table: ${tableName} for user_id: ${userId}`);

    const result = await db.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'user_id = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false, // Sort by call_id descending (most recent first)
      })
    );

    const items = result.Items || [];
    console.log(`[HISTORY] Found ${items.length} calls for user ${userId}`);

    // Apply pagination
    const paginatedItems = items.slice(offset, offset + limit);

    // Build response - mobile app's backendData IS the response.data field
    // So we need calls at the top level for: Array.isArray(backendData.calls)
    const paginationData = {
      offset,
      limit,
      total: items.length,
      hasMore: offset + limit < items.length,
    };

    // Top-level calls array that mobile app checks for
    const responseBody = {
      success: true,
      message: `Retrieved ${paginatedItems.length} calls`,
      timestamp: new Date().toISOString(),
      calls: paginatedItems,
      pagination: paginationData,
    };

    return c.json(responseBody, 200);
  } catch (error: any) {
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * GET /calls/:callId - Fetch details of a specific call
 */
app.get('/calls/:callId', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;
    const callId = c.req.param('callId');

    if (!callId) {
      return buildHonoBadRequest(c, 'Call ID is required');
    }

    // Get the call
    const result = await db.send(
      new GetCommand({
        TableName: process.env.CALLS_TABLE_NAME || 'calls',
        Key: {
          user_id: userId,
          call_id: callId,
        },
      })
    );

    if (!result.Item) {
      return buildHonoNotFound(c, `Call with ID ${callId} not found`);
    }

    const call = result.Item as any;

    // Get agent details for display enhancement
    let agentDetails: any = null;
    if (call.agent_id) {
      try {
        // Use Query instead of GetCommand since we don't know the agent_type (sort key)
        const agentResult = await db.send(
          new QueryCommand({
            TableName: process.env.AGENTS_TABLE_NAME || 'agents',
            KeyConditionExpression: 'agent_id = :agentId',
            ExpressionAttributeValues: {
              ':agentId': String(call.agent_id),
            },
            Limit: 1,
          })
        );
        if (agentResult.Items && agentResult.Items.length > 0) {
          agentDetails = agentResult.Items[0];
        }
      } catch (error) {
        // Agent fetch error is non-critical
        console.warn('Could not fetch agent details:', error);
      }
    }

    return buildHonoSuccess(
      c,
      {
        ...call,
        agent: agentDetails,
      },
      'Call details retrieved'
    );
  } catch (error: any) {
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * GET /messages/:agentId - Fetch messages for specific agent conversation
 * Returns message thread with a specific agent
 * Supports pagination with offset and limit
 */
app.get('/messages/:agentId', async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return buildHonoUnauthorized(c);
  }

  try {
    const { userId } = auth;
    const agentId = c.req.param('agentId');

    if (!agentId) {
      return buildHonoBadRequest(c, 'Agent ID is required');
    }

    // Parse pagination parameters
    const offset = parseInt(c.req.query('offset') || '0');
    const limit = parseInt(c.req.query('limit') || '20');

    if (offset < 0 || limit < 1 || limit > 100) {
      return buildHonoBadRequest(c, 'Invalid pagination parameters. offset >= 0, 1 <= limit <= 100');
    }

    // Query messages using composite sort key for efficient agent-specific queries with pagination
    // Table: PK=user_id, SK=composite_key (format: agent_id#message_id)
    // Using begins_with to query all messages for a specific agent

    const result = await db.send(
      new QueryCommand({
        TableName: process.env.MESSAGES_TABLE_NAME || 'messages',
        KeyConditionExpression: 'user_id = :userId AND begins_with(composite_key, :agentPrefix)',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':agentPrefix': `${agentId}#`,
        },
        ScanIndexForward: false, // Sort by composite_key descending (newest first)
      })
    );

    const items = result.Items || [];

    // Items from query are sorted by composite_key descending, but composite_key is UUID-based (not time-based)
    // Need to sort by timestamp to get actual chronological order
    // Sort descending (newest first) so pagination can return recent messages first
    const sortedItems = items.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.created_at || 0).getTime();
      const timeB = new Date(b.timestamp || b.created_at || 0).getTime();
      if (timeA !== timeB) {
        return timeB - timeA; // Sort descending (newest first)
      }
      // Secondary sort by message_id to ensure stable ordering when timestamps are equal
      const idA = a.message_id || a.composite_key || '';
      const idB = b.message_id || b.composite_key || '';
      return idB.localeCompare(idA); // Also descending for consistency
    });

    // For pagination: offset=0 means get the LATEST messages (at start of descending array)
    // offset=20 means skip latest 20, get the next older batch
    // Slice from descending array, then reverse to get chronological order (oldest first)
    const paginatedItems = sortedItems.slice(offset, offset + limit).reverse();

    // Get agent details for enrichment
    let agentDetails: any = null;
    if (agentId) {
      try {
        // Use Query instead of GetCommand since we don't know the agent_type (sort key)
        const agentResult = await db.send(
          new QueryCommand({
            TableName: process.env.AGENTS_TABLE_NAME || 'agents',
            KeyConditionExpression: 'agent_id = :agentId',
            ExpressionAttributeValues: {
              ':agentId': String(agentId),
            },
            Limit: 1,
          })
        );
        if (agentResult.Items && agentResult.Items.length > 0) {
          agentDetails = {
            agent_name: agentResult.Items[0].name,
            agent_avatar: agentResult.Items[0].avatar,
          };
        }
      } catch (error) {
        // Agent fetch error is non-critical
        console.warn('Could not fetch agent details:', error);
      }
    }

    return buildHonoSuccess(
      c,
      {
        agent_id: agentId,
        ...agentDetails,
        messages: paginatedItems,
        pagination: {
          offset,
          limit,
          total: sortedItems.length,
          hasMore: offset + limit < sortedItems.length, // Check if there are older messages
        },
      },
      `Retrieved ${paginatedItems.length} messages for agent (total: ${sortedItems.length})`
    );
  } catch (error: any) {
    return buildHonoErrorResponse(c, error);
  }
});

export default handle(app);
