import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { Mem0Client, Mem0Message } from '../../shared/clients/mem0-client';
import { AiProviderService } from '../../shared/services/ai-provider.service';
import { getModelInfo, getModelConfig } from '../../shared/config/ai-models.config';
import { trackCallSuccess, MetricName, publishMetric } from '../../shared/utils/metrics';
import { StandardUnit } from '@aws-sdk/client-cloudwatch';

/**
 * Call end event structure from SQS
 */
interface CallEndEvent {
  callId: string;
  userId: string;
  agentId: string;
  transcript: string;
  duration: number;
  endReason: string;
}

/**
 * Extracted insights from call analysis
 */
interface CallInsights {
  messages: Mem0Message[];
  topics: string[];
  sentiment: string;
  importance: string;
  keyFacts: string[];
  userPreferences: string[];
}

/**
 * Zod schema for structured LLM output (replaces fragile regex JSON parsing)
 * Using generateObject with this schema guarantees valid, typed responses
 */
const callInsightsSchema = z.object({
  key_facts: z
    .array(z.string())
    .describe('Important information learned about the user (2-5 facts)'),
  user_preferences: z
    .array(z.string())
    .describe("User's stated likes, dislikes, or preferences"),
  topics: z
    .array(z.string())
    .max(5)
    .describe('Main discussion topics (max 5)'),
  sentiment: z
    .enum(['positive', 'neutral', 'negative'])
    .describe('Overall emotional tone of the conversation'),
  importance: z
    .enum(['low', 'medium', 'high'])
    .describe('How significant this conversation was'),
});

type LLMInsightsResponse = z.infer<typeof callInsightsSchema>;

const dbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

/**
 * Transcript processing limits
 * Based on Gemini 2.5 Flash Lite capabilities and Lambda timeout constraints
 */
const TRANSCRIPT_LIMITS = {
  // Max characters (~500K tokens at ~4 chars/token, well under 1M token limit)
  MAX_LENGTH: 500_000,

  // Min meaningful transcript length (skip very short transcripts)
  MIN_LENGTH: 50,

  // If transcript exceeds max, keep this many chars from the END (most recent = most relevant)
  TRUNCATE_KEEP_END: 400_000,

  // LLM call timeout in milliseconds (2 minutes per call, leaving buffer for 5-min Lambda)
  LLM_TIMEOUT_MS: 120_000,
} as const;

/**
 * Main Lambda handler for processing call end events
 * Triggered by SQS queue when calls complete
 */
export const handler = async (event: SQSEvent) => {
  console.log('[CallProcessor] Processing call events:', {
    recordCount: event.Records.length,
  });

  const failedRecords: any[] = [];

  // Process each SQS record
  for (const record of event.Records) {
    try {
      await processCallEndEvent(record);
    } catch (error) {
      console.error('[CallProcessor] Failed to process record:', error);
      // Return failed record for retry
      failedRecords.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  // Return partial batch response for failed records
  if (failedRecords.length > 0) {
    console.warn(`[CallProcessor] ${failedRecords.length} records failed, will retry`);
    return { batchItemFailures: failedRecords };
  }

  console.log('[CallProcessor] Successfully processed all records');
  return { batchItemFailures: [] };
};

/**
 * Validate and optionally truncate transcript for LLM processing
 * Returns null if transcript is too short to be meaningful
 */
function validateAndPrepareTranscript(
  transcript: string,
  callId: string
): { transcript: string; wasTruncated: boolean } | null {
  const trimmed = transcript?.trim() || '';

  // Check minimum length
  if (trimmed.length < TRANSCRIPT_LIMITS.MIN_LENGTH) {
    console.warn(
      `[CallProcessor] Call ${callId} transcript too short (${trimmed.length} chars < ${TRANSCRIPT_LIMITS.MIN_LENGTH})`
    );
    return null;
  }

  // Check if truncation needed
  if (trimmed.length > TRANSCRIPT_LIMITS.MAX_LENGTH) {
    console.warn(
      `[CallProcessor] Call ${callId} transcript too long (${trimmed.length} chars), truncating to last ${TRANSCRIPT_LIMITS.TRUNCATE_KEEP_END} chars`
    );

    // Keep the END of the transcript (most recent conversation is most relevant)
    const truncated = trimmed.slice(-TRANSCRIPT_LIMITS.TRUNCATE_KEEP_END);

    // Find a natural break point (newline or sentence end)
    const firstNewline = truncated.indexOf('\n');
    const cleanStart = firstNewline > 0 && firstNewline < 1000 ? firstNewline + 1 : 0;

    return {
      transcript: '[...transcript truncated...]\n\n' + truncated.slice(cleanStart),
      wasTruncated: true,
    };
  }

  return { transcript: trimmed, wasTruncated: false };
}

/**
 * Parse and validate the SQS message body
 * Throws on invalid JSON or missing required fields
 */
function parseCallEndEvent(body: string): CallEndEvent {
  let parsed: any;
  try {
    parsed = JSON.parse(body);
  } catch (error) {
    throw new Error(`Invalid JSON in SQS message: ${error}`);
  }

  // Validate required fields
  const requiredFields = ['callId', 'userId', 'agentId', 'transcript', 'duration', 'endReason'];
  const missingFields = requiredFields.filter((field) => !(field in parsed));

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields in call end event: ${missingFields.join(', ')}`);
  }

  return parsed as CallEndEvent;
}

/**
 * Process a single call end event
 */
async function processCallEndEvent(record: SQSRecord): Promise<void> {
  const event = parseCallEndEvent(record.body);
  const { callId, userId, agentId, transcript: rawTranscript, duration, endReason } = event;

  // Validate and prepare transcript (handles empty, too short, and too long cases)
  const transcriptResult = validateAndPrepareTranscript(rawTranscript, callId);

  if (!transcriptResult) {
    console.warn(`[CallProcessor] Call ${callId} has insufficient transcript, skipping LLM processing`);
    // Still update call record to mark as processed (but with minimal data)
    await dbClient.send(
      new UpdateCommand({
        TableName: process.env.CALLS_TABLE_NAME,
        Key: { user_id: userId, call_id: callId },
        UpdateExpression:
          'SET summary = :summary, memory_extracted = :extracted, processed_at = :now',
        ConditionExpression: 'attribute_not_exists(memory_extracted) OR memory_extracted = :false',
        ExpressionAttributeValues: {
          ':summary': 'Call had insufficient transcript content for analysis.',
          ':extracted': true,
          ':now': new Date().toISOString(),
          ':false': false,
        },
      })
    );
    return;
  }

  const { transcript, wasTruncated } = transcriptResult;

  console.log(`[CallProcessor] Processing call: ${callId}`, {
    userId,
    agentId,
    duration,
    transcriptLength: transcript.length,
    originalLength: rawTranscript.length,
    wasTruncated,
  });

  // Track call completion with actual duration
  await trackCallSuccess(agentId, userId, duration);

  // 1. Get call details from DynamoDB
  const callResponse = await dbClient.send(
    new GetCommand({
      TableName: process.env.CALLS_TABLE_NAME,
      Key: { user_id: userId, call_id: callId },
    })
  );

  if (!callResponse.Item) {
    throw new Error(`Call ${callId} not found in database`);
  }

  const call = callResponse.Item;

  // 2. Get agent info
  // Use QueryCommand since we don't know the agent_type (sort key)
  const agentResponse = await dbClient.send(
    new QueryCommand({
      TableName: process.env.AGENTS_TABLE_NAME,
      KeyConditionExpression: 'agent_id = :agentId',
      ExpressionAttributeValues: { ':agentId': agentId },
      Limit: 1,
    })
  );

  const agent = agentResponse.Items?.[0];
  const agentName = agent?.name || 'Agent';

  console.log(`[CallProcessor] Found agent: ${agentName}`);

  // 3. Check if user has a stored API key
  let userApiKey: string | undefined;
  try {
    const userResponse = await dbClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE_NAME,
        Key: { user_id: userId },
        ProjectionExpression: 'byokApiKey',
      })
    );
    if (userResponse.Item?.byokApiKey) {
      userApiKey = userResponse.Item.byokApiKey;
      console.log('[CallProcessor] User API key found, using it');
    }
  } catch (err) {
    console.error('[CallProcessor] Failed to fetch user API key:', err);
  }

  if (!userApiKey) {
    console.error('[CallProcessor] No user API key available, cannot process call');
    throw new Error('User API key not found — cannot process call transcript');
  }

  // 4. Initialize AI provider with user's BYOK key
  const aiProvider = AiProviderService.new();
  const modelConfig = getModelConfig('callProcessor');
  const model = await aiProvider.getAiProvider({
    modelInfo: getModelInfo('callProcessor'),
    userApiKey,
  });

  console.log(`[CallProcessor] Initialized AI provider (${modelConfig.modelId})`);

  // 5. Summarize the call
  console.log('[CallProcessor] Generating call summary...');
  const summaryStartTime = Date.now();
  const summary = await summarizeCall(model, transcript, agentName);
  const summaryDuration = Date.now() - summaryStartTime;

  console.log('[CallProcessor] Summary generated:', summary.substring(0, 100) + '...');

  // Track LLM latency for summary generation
  await publishMetric(
    MetricName.DAILY_API_LATENCY,
    summaryDuration,
    StandardUnit.Milliseconds,
    { Service: 'LLM-Summary', AgentId: agentId }
  );

  // 6. Extract key insights
  console.log('[CallProcessor] Extracting insights...');
  const insightsStartTime = Date.now();
  const insights = await extractInsights(model, transcript, agentName);
  const insightsDuration = Date.now() - insightsStartTime;

  console.log('[CallProcessor] Insights extracted:', {
    topics: insights.topics,
    sentiment: insights.sentiment,
    importance: insights.importance,
  });

  // Track LLM latency for insights extraction
  await publishMetric(
    MetricName.DAILY_API_LATENCY,
    insightsDuration,
    StandardUnit.Milliseconds,
    { Service: 'LLM-Insights', AgentId: agentId }
  );

  // 7. Save to Mem0
  console.log('[CallProcessor] Saving memories to Mem0...');
  const mem0StartTime = Date.now();
  const memoryIds = await Mem0Client.add(insights.messages, {
    user_id: userId,
    agent_id: agentId,
    metadata: {
      conversation_type: 'voice_call',
      call_id: callId,
      call_duration: duration,
      agent_name: agentName,
      topics: insights.topics,
      sentiment: insights.sentiment,
      importance: insights.importance,
      created_at: new Date().toISOString(),
      end_reason: endReason,
    },
  });
  const mem0Duration = Date.now() - mem0StartTime;

  console.log(`[CallProcessor] Saved ${memoryIds.length} memories to Mem0`);

  // Track Mem0 API latency
  await publishMetric(
    MetricName.DAILY_API_LATENCY,
    mem0Duration,
    StandardUnit.Milliseconds,
    { Service: 'Mem0-Save', AgentId: agentId }
  );

  // 8. Update call record in DynamoDB with conditional write
  console.log('[CallProcessor] Updating call record in DynamoDB...');
  try {
    await dbClient.send(
      new UpdateCommand({
        TableName: process.env.CALLS_TABLE_NAME,
        Key: { user_id: userId, call_id: callId },
        UpdateExpression:
          'SET summary = :summary, memory_extracted = :extracted, memory_ids = :ids, processed_at = :now, insights = :insights',
        // ⚡ CONDITIONAL WRITE: Only update if not already processed
        // Prevents duplicate processing if SQS retries the message
        ConditionExpression: 'attribute_not_exists(memory_extracted) OR memory_extracted = :false',
        ExpressionAttributeValues: {
          ':summary': summary,
          ':extracted': true,
          ':ids': memoryIds,
          ':now': new Date().toISOString(),
          ':false': false,
          ':insights': {
            topics: insights.topics,
            sentiment: insights.sentiment,
            importance: insights.importance,
            keyFacts: insights.keyFacts,
            userPreferences: insights.userPreferences,
          },
        },
      })
    );

    console.log(`✅ [CallProcessor] Successfully processed call ${callId}`);
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.warn(
        `⚠️  [CallProcessor] Call ${callId} already processed, skipping update (SQS retry detected)`
      );
      // This is expected for SQS retries - don't throw
    } else {
      console.error(`❌ [CallProcessor] Failed to update call record:`, error);
      throw error; // Re-throw for SQS retry
    }
  }
}

/**
 * Execute a promise with timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

/**
 * Summarize call transcript using LLM
 */
async function summarizeCall(
  model: any,
  transcript: string,
  agentName: string
): Promise<string> {
  try {
    const generatePromise = generateText({
      model,
      prompt: `Summarize the following conversation between a user and ${agentName} (an AI assistant).

Provide a concise 2-3 sentence summary covering:
- Main topics discussed
- Key points and decisions
- Overall sentiment and outcome

Keep it brief and factual. Focus on what matters most.

Transcript:
${transcript}

Summary:`,
      temperature: 0.3, // Lower temperature for consistent summaries
    });

    const { text } = await withTimeout(
      generatePromise,
      TRANSCRIPT_LIMITS.LLM_TIMEOUT_MS,
      'LLM summary generation'
    );

    return text.trim();
  } catch (error: any) {
    console.error('[CallProcessor] Failed to generate summary:', error);

    // Differentiate timeout vs other errors for metrics
    if (error.message?.includes('timed out')) {
      console.error('[CallProcessor] LLM call timed out - transcript may be too long or API is slow');
    }

    return 'Call summary unavailable due to processing error.';
  }
}

/**
 * Extract structured insights from call transcript using Zod schema
 * Uses generateObject for guaranteed valid, typed JSON output
 */
async function extractInsights(
  model: any,
  transcript: string,
  agentName: string
): Promise<CallInsights> {
  try {
    // Use generateObject with Zod schema for structured, validated output
    const generatePromise = generateObject({
      model,
      schema: callInsightsSchema,
      prompt: `Analyze the following conversation between a user and ${agentName} and extract key insights.

Guidelines:
- key_facts: Important information learned about the user (2-5 specific facts)
- user_preferences: User's stated likes, dislikes, or preferences
- topics: Main discussion topics (max 5)
- sentiment: Overall emotional tone (positive, neutral, or negative)
- importance: How significant this conversation was (low, medium, or high)

Transcript:
${transcript}`,
      temperature: 0.3,
    });

    const { object: parsed } = await withTimeout(
      generatePromise,
      TRANSCRIPT_LIMITS.LLM_TIMEOUT_MS,
      'LLM insights extraction'
    );

    // Format for Mem0
    const messages: Mem0Message[] = [
      {
        role: 'user',
        content: `Conversation with ${agentName} about: ${parsed.topics.join(', ')}`,
      },
      {
        role: 'assistant',
        content: `Key insights: ${parsed.key_facts.join('. ')}${
          parsed.user_preferences.length > 0
            ? `. User preferences: ${parsed.user_preferences.join('. ')}`
            : ''
        }`,
      },
    ];

    return {
      messages,
      topics: parsed.topics,
      sentiment: parsed.sentiment,
      importance: parsed.importance,
      keyFacts: parsed.key_facts,
      userPreferences: parsed.user_preferences,
    };
  } catch (error) {
    console.error('[CallProcessor] Failed to extract insights:', error);

    // Return minimal insights on error
    return {
      messages: [
        {
          role: 'user',
          content: `Conversation with ${agentName}`,
        },
        {
          role: 'assistant',
          content: 'Call completed successfully.',
        },
      ],
      topics: ['general'],
      sentiment: 'neutral',
      importance: 'medium',
      keyFacts: [],
      userPreferences: [],
    };
  }
}
