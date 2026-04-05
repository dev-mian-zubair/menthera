/**
 * Quest Insights Processor
 * Async Lambda processor for generating quest insights via LLM
 * Triggered by SQS queue when a quest is completed
 */

import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { generateObject } from 'ai';
import { z } from 'zod';
import {
  getCompleteSessionData,
  putInsight,
  updateQuestSessionReportReady,
} from './quest-sessions-helpers';
import { getQuestDefinition } from './quest-definitions-helpers';
import { buildInsightPromptData, formatScoresForPrompt, formatResponsesForPrompt } from './scoring-engine';
import { ReportInfo } from './types';
import { AiProviderService } from '../../shared/services/ai-provider.service';
import { getModelInfo, getModelConfig } from '../../shared/config/ai-models.config';
import { ChatHelpers } from '../message/chat-helpers';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

// Message type from SQS
interface QuestCompletedMessage {
  userId: string;
  agentId: string;
  sessionId: string;
  questId: string;
  questVersion: number;
  completedAt: string;
}

// Zod schema for subsection within a section
const reportSubsectionSchema = z.object({
  title: z.string().describe('Subsection title (e.g., "Key Traits", "Strengths", "Areas for Growth")'),
  content: z.string().describe(`Subsection content in Markdown format.

FORMATTING RULES:
- For single insights or statements: Write as a paragraph (2-3 sentences). Use **bold** and *italic* for emphasis, but NEVER use bullet points or lists for single items.
- For multiple insights (2 or more): Use unordered list format with bullet points (- item). Each item can use **bold** and *italic* for emphasis.
- Use bold (**text**) to emphasize key terms, traits, or important concepts.
- Use italic (*text*) sparingly for subtle emphasis or nuance.
- Keep content concise and readable (2-4 paragraphs or 2-5 bullet points maximum).
- All content will be center-aligned in the UI, so write accordingly.

EXAMPLES:
Single insight (with markdown): "You demonstrate a **strong preference** for structured environments and clear expectations. This trait helps you maintain *consistency and reliability* in your relationships, while also providing a sense of security."

Multiple insights (with bullet points):
- **Structured approach**: You prefer clear expectations and defined boundaries in relationships
- **Consistency**: You maintain reliability in commitments and follow-through with plans
- **Planning mindset**: You value preparation and thoughtful decision-making over spontaneity`),
});

// Zod schema for report section
const reportSectionSchema = z.object({
  id: z.string().describe('Unique identifier for the section (e.g., "summary", "profile", "patterns", "recommendations")'),
  title: z.string().describe('Display title for the section'),
  icon: z.string().describe('Emoji icon for the section'),
  summary: z.string().describe('Brief overview of this section (1-2 sentences)'),
  subsections: z.array(reportSubsectionSchema).describe('Array of subsections that break down the content into digestible parts. Each subsection should focus on a specific aspect.'),
  order: z.number().describe('Display order of the section (1, 2, 3, 4, etc.)'),
});

// Zod schema for LLM response validation
const insightSchema = z.object({
  title: z.string().describe('Overall report title (e.g., "Your Personality Insights")'),
  description: z.string().describe('Brief description of the report (1 sentence)'),
  sections: z.array(reportSectionSchema).describe('Array of report sections with subsections. Should include: summary, profile, patterns, and recommendations sections. Each section should have 2-4 subsections for better readability.'),
});

// LLM response format (inferred from Zod schema)
type LLMInsightResponse = z.infer<typeof insightSchema>;
type ReportSection = z.infer<typeof reportSectionSchema>;
type ReportSubsection = z.infer<typeof reportSubsectionSchema>;

/**
 * Main handler for SQS messages
 */
export async function handler(event: SQSEvent): Promise<void> {
  console.log('[Insights Processor] Processing', event.Records.length, 'messages');

  for (const record of event.Records) {
    try {
      await processQuestCompletion(record);
    } catch (error) {
      console.error('[Insights Processor] Error processing record:', error);
      // Let the message go to DLQ if processing fails
      throw error;
    }
  }
}

/**
 * Process a single quest completion message
 */
async function processQuestCompletion(record: SQSRecord): Promise<void> {
  const message: QuestCompletedMessage = JSON.parse(record.body);
  console.log('[Insights Processor] Processing quest completion:', message);

  const { userId, agentId, sessionId, questId, questVersion } = message;

  // Fetch complete session data
  const sessionData = await getCompleteSessionData(db, userId, agentId, sessionId);

  if (!sessionData) {
    console.error('[Insights Processor] Session not found:', sessionId);
    return;
  }

  const { session, responses, scores } = sessionData;

  if (scores.length === 0) {
    console.error('[Insights Processor] No scores found for session:', sessionId);
    return;
  }

  // Fetch quest definition for questions
  const questData = await getQuestDefinition(db, questId, questVersion);

  if (!questData) {
    console.error('[Insights Processor] Quest definition not found:', questId);
    return;
  }

  const { questions, tasks, definition } = questData;

  // Check if quest has a prompt template
  if (!definition.reportPromptTemplate) {
    console.error('[Insights Processor] No reportPromptTemplate found for quest:', questId);
    throw new Error(`No reportPromptTemplate found for quest ${questId}`);
  }

  // Build prompt data using task definitions (which include interpretations)
  const promptData = buildInsightPromptData(
    questId,
    questVersion,
    agentId,
    scores,
    responses,
    questions,
    tasks // Pass tasks instead of questScoring
  );

  // Get prompt template from quest definition
  const promptTemplate = definition.reportPromptTemplate;

  // Render prompt with data
  const renderedPrompt = renderPrompt(promptTemplate, promptData);

  console.log('[Insights Processor] Generated prompt for LLM');

  // Check if user has a stored API key
  let userApiKey: string | undefined;
  try {
    const userResponse = await db.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: { user_id: userId },
        ProjectionExpression: 'byokApiKey',
      })
    );
    if (userResponse.Item?.byokApiKey) {
      userApiKey = userResponse.Item.byokApiKey;
      console.log('[Insights Processor] User API key found, using it');
    }
  } catch (err) {
    console.error('[Insights Processor] Failed to fetch user API key:', err);
  }

  if (!userApiKey) {
    console.error('[Insights Processor] No user API key available, cannot generate insights');
    throw new Error('User API key not found — cannot generate quest insights');
  }

  // Call LLM to generate insights
  const insights = await generateInsights(renderedPrompt, userApiKey);

  console.log('[Insights Processor] Generated insights');

  // Save insights to database
  await saveInsights(userId, agentId, sessionId, insights);

  console.log('[Insights Processor] Saved insights for session:', sessionId);

  // Update session record to mark report as ready
  await updateQuestSessionReportReady(db, userId, agentId, sessionId, true);

  console.log('[Insights Processor] Marked report as ready for session:', sessionId);

  // Send report notification to chat
  await sendReportNotification(userId, agentId, questId, sessionId, questData.definition.reportInfo);

  console.log('[Insights Processor] Sent report notification for session:', sessionId);
}

/**
 * Render prompt with data
 */
function renderPrompt(template: string, data: any): string {
  let rendered = template;

  // Replace {{scores}} with formatted scores
  const scoresFormatted = formatScoresForPrompt(data.scores);
  rendered = rendered.replace('{{scores}}', scoresFormatted);

  // Replace {{responses}} with formatted responses
  const responsesFormatted = formatResponsesForPrompt(data.responses);
  rendered = rendered.replace('{{responses}}', responsesFormatted);

  // Replace other simple variables
  rendered = rendered.replace('{{questId}}', data.questId);
  rendered = rendered.replace('{{agentId}}', data.agentId);

  return rendered;
}

/**
 * Call LLM to generate insights using AI SDK with structured output
 */
async function generateInsights(prompt: string, userApiKey?: string): Promise<LLMInsightResponse> {
  try {
    // Initialize AI provider with user's BYOK key
    const aiProvider = AiProviderService.new();
    const model = await aiProvider.getAiProvider({
      modelInfo: getModelInfo('questInsights'),
      userApiKey,
    });

    console.log('[Insights Processor] Calling LLM for insight generation with structured output');

    // Use generateObject with Zod schema for type-safe structured output
    const result = await generateObject({
      model,
      schema: insightSchema,
      prompt,
      temperature: 0.7,
    });

    console.log('[Insights Processor] LLM response received:', {
      usage: result.usage,
      objectKeys: Object.keys(result.object),
    });

    // Return validated object directly
    return result.object;
  } catch (error) {
    console.error('[Insights Processor] Error generating insights:', error);
    throw error;
  }
}

/**
 * Save insights to database
 */
async function saveInsights(
  userId: string,
  agentId: string,
  sessionId: string,
  insights: LLMInsightResponse
): Promise<void> {
  const model = getModelConfig('questInsights').modelId; // Track which model was used

  // Save complete report as a single JSON record
  await putInsight(
    db,
    userId,
    agentId,
    sessionId,
    'report',
    JSON.stringify(insights),
    model
  );

  console.log('[Insights Processor] Saved complete report with', insights.sections.length, 'sections');
}

/**
 * Send report notification to chat
 */
async function sendReportNotification(
  userId: string,
  agentId: string,
  questId: string,
  sessionId: string,
  reportInfo?: ReportInfo
): Promise<void> {
  if (!reportInfo) {
    console.log('[Insights Processor] No reportInfo configured, skipping notification');
    return;
  }

  const messagesTableName = process.env.MESSAGES_TABLE_NAME || 'dev-messages';
  const chatHelpers = ChatHelpers.new({ db, messagesTableName });

  // Use messageTemplate if provided, otherwise use a default message
  const content = reportInfo.messageTemplate || `${reportInfo.icon || '📊'} ${reportInfo.title}`;

  await chatHelpers.saveReportNotification({
    userId,
    agentId,
    content,
    metadata: {
      questId,
      sessionId,
      title: reportInfo.title,
      shortDescription: reportInfo.shortDescription,
      icon: reportInfo.icon,
    },
  });

  console.log('[Insights Processor] Report notification saved to chat');
}
