import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { streamHandle } from 'hono/aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { getAuth } from '@hono/clerk-auth';
import customClerkMiddleware from '../../shared/auth-middleware';
import {
  buildHonoErrorResponse,
} from '../../shared/utils/response-builder';
import { AiProviderService } from '../../shared/services/ai-provider.service';
import { getModelInfo, getModelConfig } from '../../shared/config/ai-models.config';
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { ChatHelpers } from './chat-helpers';
import { Mem0Client } from '../../shared/clients/mem0-client';
import { getCompleteSessionData } from '../quests/quest-sessions-helpers';
import { getQuestDefinition } from '../quests/quest-definitions-helpers';
import { buildUserProfileContext } from '../../shared/utils/onboarding-context';
import { RateLimiter, RateLimitPresets, getRateLimitHeaders } from '../../shared/utils/rate-limiter';

const app = new Hono();

// Helper function to extract text content from UIMessage
function getTextContent(message: UIMessage): string {
  // Extract text from all text parts in the message
  return message.parts
    ?.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map(part => part.text)
    .join('') || '';
}

app.use(logger());
app.use('*', customClerkMiddleware);
app.use('*', cors());

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

/**
 * POST /message/:agentId - Send a message to an agent with streaming response
 * Supports streaming responses for real-time message updates
 * Request body: { messages: Message[], timezone?: string }
 */
app.post('/message/:agentId', async (c) => {
  try {
    // Request validation and parsing
    const auth = getAuth(c);

    if (!auth?.userId) {
      console.error('[Message API] Unauthorized request - missing userId');
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const agentId = c.req.param('agentId');
    if (!agentId) {
      console.error('[Message API] Missing agent ID');
      throw new HTTPException(400, { message: 'Agent ID is required' });
    }

    const body = await c.req.json();
    let messages = body.messages as UIMessage[];
    const timezone = body.timezone as string | undefined;

    if (!messages || !Array.isArray(messages)) {
      console.error('[Message API] Invalid messages format');
      throw new HTTPException(400, { message: 'Messages array is required' });
    }

    if (messages.length === 0) {
      console.error('[Message API] Empty messages array');
      throw new HTTPException(400, { message: 'Messages array cannot be empty' });
    }

    // Truncate to last 20 messages to prevent excessive context length
    if (messages.length > 20) {
      console.log(
        `[Message API] Truncating ${messages.length} messages to last 20`
      );
      messages = messages.slice(-20);
    }

    const { userId } = auth;

    // === RATE LIMITING ===
    const rateLimiter = new RateLimiter(db, process.env.RATE_LIMIT_TABLE_NAME || 'rate-limits');
    const rateLimitResult = await rateLimiter.checkLimit(userId, RateLimitPresets.MESSAGE_SEND);

    if (!rateLimitResult.allowed) {
      console.warn(`[Message API] Rate limit exceeded for user ${userId}`);
      return c.json(
        {
          success: false,
          error: 'Rate limit exceeded. Too many message requests.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // === FETCH USER PROFILE DATA (ONBOARDING + ASSESSMENTS) ===
    let userProfileContext: string | null = null;
    let isByok = false;
    let userApiKey: string | undefined;
    try {
      const userResult = await db.send(
        new GetCommand({
          TableName: process.env.USERS_TABLE_NAME || 'users',
          Key: { user_id: userId },
        })
      );

      if (userResult.Item) {
        // Check if user has a stored API key
        isByok = !!userResult.Item.byokApiKey;

        if (!isByok) {
          console.warn('[Message API] User has no API key stored:', userId);
          throw new HTTPException(403, {
            message: 'API key required. Please add your Google Gemini API key to continue.',
          });
        }

        userApiKey = userResult.Item.byokApiKey;
        console.log('[Message API] BYOK user detected, using user API key');

        const userName = userResult.Item.first_name || null;
        userProfileContext = buildUserProfileContext(
          {
            onboarding: userResult.Item.onboarding,
            assessments: userResult.Item.assessments,
            userName,
          },
          null,
          agentId
        );
        console.log('[Message API] User profile data found:', {
          hasName: !!userName,
          hasLanguage: !!userResult.Item.onboarding?.preferredLanguage,
          hasGoals: !!userResult.Item.onboarding?.goals,
          hasCoachingStyle: !!userResult.Item.onboarding?.preferredCoachingStyle,
          hasAssessments: !!userResult.Item.assessments,
          hasAgentAssessment: !!userResult.Item.assessments?.[agentId],
        });
      } else {
        // No user record at all
        throw new HTTPException(403, {
          message: 'Active BYOK subscription with API key required.',
        });
      }
    } catch (err) {
      if (err instanceof HTTPException) throw err;
      console.warn('[Message API] Failed to fetch user profile data:', err);
    }

    // Find the most recent user message (the UI may append assistant/system entries after the user's input)
    const userMessage: UIMessage | undefined = [...messages]
      .slice()
      .reverse()
      .find((m) => m.role === 'user');

    if (!userMessage) {
      console.error('[Message API] No user message found in messages array');
      throw new HTTPException(400, {
        message: 'At least one user message is required',
      });
    }

    // Extract text content from the user message
    const userMessageContent = getTextContent(userMessage);

    if (!userMessageContent || userMessageContent.trim().length === 0) {
      console.error('[Message API] User message has no text content');
      throw new HTTPException(400, { message: 'User message must contain text content' });
    }

    // Check for quest welcome command: /quest-welcome:{sessionId}
    const questWelcomeMatch = userMessageContent.match(/^\/quest-welcome:(.+)$/);
    const isQuestWelcome = !!questWelcomeMatch;
    const questSessionId = questWelcomeMatch?.[1] || null;

    // Use current timestamp for message
    const userMessageTimestamp = Date.now();

    // Initialize chat helpers
    const messagesTableName = process.env.MESSAGES_TABLE_NAME || 'messages';
    const chatHelpers = ChatHelpers.new({
      db,
      messagesTableName,
    });

    let memoryContext = null;
    try {
      // === FETCH MEMORIES FROM MEM0 ===
        const memories = await Mem0Client.search(
          userMessageContent,
          auth.userId,
          agentId,
        );

        memoryContext = Mem0Client.formatMemories(memories);
        console.log(`[Message API] Retrieved ${memories.length} memories for context`);

        if (memoryContext) {
          memoryContext = `Relevant context from previous interactions:\n${memoryContext}`;
          console.log('[Message API] Added memory context to system prompt');
        }
    } catch (error) {
      console.error('[Message API] Error fetching memories:', error);
    }

    // Save user message with timestamp
    console.log('[Message API] Saving user message...', {
      userId,
      agentId,
      messageLength: userMessageContent.length,
      timestamp: userMessageTimestamp,
    });
    await chatHelpers.saveUserMessage({
      userId,
      agentId,
      content: userMessageContent,
      timestamp: userMessageTimestamp,
      timezone,
    });
    console.log('[Message API] User message saved successfully');

    // Fetch quest session data if this is a quest welcome command
    let questContext = '';
    if (isQuestWelcome && questSessionId) {
      console.log('[Message API] ===== QUEST INSIGHTS PROCESSING START =====');
      console.log('[Message API] Quest welcome command detected');
      console.log('[Message API] Quest session ID:', questSessionId);
      console.log('[Message API] User ID:', userId);
      console.log('[Message API] Agent ID:', agentId);

      try {
        const sessionData = await getCompleteSessionData(db, userId, agentId, questSessionId);

        console.log('[Message API] Session data fetched:', {
          hasSessionData: !!sessionData,
          hasSession: !!sessionData?.session,
          scoresCount: sessionData?.scores?.length || 0,
        });

        if (sessionData && sessionData.scores.length > 0) {
          const { session, scores } = sessionData;

          console.log('[Message API] Quest session details:', {
            questId: session.questId,
            questVersion: session.questVersion,
            sessionStatus: session.status,
            completedAt: session.completedAt,
          });

          // Log all scores for debugging
          console.log('[Message API] ===== QUEST SCORES =====');
          scores.forEach((score, index) => {
            console.log(`[Message API] Score ${index + 1}:`, {
              taskId: score.taskId,
              rawScore: score.rawScore,
              category: score.category,
              normalizedScore: score.normalizedScore,
            });
          });
          console.log('[Message API] ===== END QUEST SCORES =====');

          // Fetch quest definition to get the title
          const questData = await getQuestDefinition(db, session.questId, session.questVersion);
          const questTitle = questData?.definition.title || 'assessment';

          console.log('[Message API] Quest definition:', {
            questTitle,
            hasDefinition: !!questData?.definition,
          });

          // Check if user has previous chat history (more than just the welcome command)
          const hasHistory = messages.length > 1;
          console.log('[Message API] User history status:', {
            hasHistory,
            messageCount: messages.length,
          });

          // Format scores with interpretations from task definitions
          const formattedScores = scores
            .map((score) => {
              // Find the task definition to get interpretations
              const task = questData?.tasks.find((t) => t.taskId === score.taskId);
              const taskTitle = task?.title || score.taskId
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

              // Find the matching interpretation for this score's category
              const interpretation = task?.interpretations?.find(
                (interp) => interp.category === score.category
              );

              if (interpretation) {
                // Rich format with label and description
                return `- **${taskTitle}**: ${interpretation.label} (${score.rawScore.toFixed(1)}/7)
  ${interpretation.description}`;
              } else {
                // Fallback format if no interpretation found
                return `- **${taskTitle}**: ${score.rawScore.toFixed(1)}/7 (${score.category})`;
              }
            })
            .join('\n\n');

          // Build quest context
          questContext = `
=== QUEST COMPLETION CONTEXT ===

The user just completed a ${questTitle}. Here are their psychometric scores:

${formattedScores}

${hasHistory
  ? 'This is a returning user. Acknowledge that you now understand them better based on their assessment results.'
  : 'This is a new user meeting you for the first time. Give a brief, warm introduction and welcome them based on their personality profile.'}

Respond naturally and personally, referencing their scores to show you understand their personality. Be conversational and encouraging.

===================================
`;
          console.log('[Message API] Quest context built:', questContext.length, 'characters');
        } else {
          console.warn('[Message API] Quest session has no scores:', questSessionId, 'status:', sessionData?.session?.status);
        }
      } catch (questErr) {
        console.error('[Message API] Error fetching quest session:', questErr);
        console.error('[Message API] Quest error details:', {
          errorName: questErr instanceof Error ? questErr.name : 'Unknown',
          errorMessage: questErr instanceof Error ? questErr.message : String(questErr),
          stack: questErr instanceof Error ? questErr.stack : undefined,
        });
        // Don't fail the request, just proceed without quest context
      }
      console.log('[Message API] ===== QUEST INSIGHTS PROCESSING END =====');
    }

    // ========================================
    // SYSTEM PROMPT BUILDING
    // ========================================
    console.log('[Message API] ===== SYSTEM PROMPT BUILDING START =====');
    console.log('[Message API] Fetching agent:', agentId);

    let agentPrompt = 'You are a helpful AI assistant.'; // Default prompt
    let agentName = 'Unknown Agent';

    try {
      // Use Query instead of GetCommand since we don't know the agent_type (sort key)
      // Query by agent_id partition key and get the first result
      const agentResult = await db.send(
        new QueryCommand({
          TableName: process.env.AGENTS_TABLE_NAME || 'agents',
          KeyConditionExpression: 'agent_id = :agentId',
          ExpressionAttributeValues: {
            ':agentId': agentId,
          },
          Limit: 1,
        })
      );

      if (agentResult.Items && agentResult.Items.length > 0) {
        const agent = agentResult.Items[0];
        agentName = agent.name || 'Unknown Agent';

        console.log('[Message API] Agent found:', {
          agentId: agent.agent_id,
          name: agentName,
          hasMessagePrompt: !!agent.message_prompt,
          promptLength: agent.message_prompt?.length || 0,
        });

        if (agent.message_prompt) {
          // Build final prompt with quest context, memory context, and agent prompt
          const contextParts: { name: string; content: string }[] = [];

          console.log('[Message API] Building system prompt from parts:');

          if (questContext) {
            contextParts.push({ name: 'QUEST_CONTEXT', content: questContext });
            console.log('[Message API] ✓ Quest context added (length:', questContext.length, 'chars)');
          } else {
            console.log('[Message API] ✗ No quest context');
          }

          // Add user profile context (onboarding + assessments)
          if (userProfileContext) {
            contextParts.push({ name: 'USER_PROFILE_CONTEXT', content: userProfileContext });
            console.log('[Message API] ✓ User profile context added (length:', userProfileContext.length, 'chars)');
          } else {
            console.log('[Message API] ✗ No user profile context');
          }

          if (memoryContext) {
            contextParts.push({ name: 'MEMORY_CONTEXT', content: memoryContext });
            console.log('[Message API] ✓ Memory context added (length:', memoryContext.length, 'chars)');
          } else {
            console.log('[Message API] ✗ No memory context');
          }

          contextParts.push({ name: 'AGENT_BASE_PROMPT', content: agent.message_prompt });
          console.log('[Message API] ✓ Agent base prompt added (length:', agent.message_prompt.length, 'chars)');

          agentPrompt = contextParts.map(p => p.content).join('\n\n');

          // ===== DETAILED SYSTEM PROMPT LOGGING FOR CLOUDWATCH =====
          console.log('[Message API] ===== FINAL SYSTEM PROMPT DETAILS =====');
          console.log('[Message API] Prompt composition summary:', {
            totalLength: agentPrompt.length,
            partsCount: contextParts.length,
            parts: contextParts.map(p => ({ name: p.name, length: p.content.length })),
            hasQuestContext: !!questContext,
            hasUserProfileContext: !!userProfileContext,
            hasMemoryContext: !!memoryContext,
            userId,
            agentId,
            agentName,
          });

          console.log('[Message API] System prompt built:', {
            length: agentPrompt.length,
            hasQuest: !!questContext,
            hasMemory: !!memoryContext,
            hasUserProfile: !!userProfileContext,
            partsCount: contextParts.length,
            parts: contextParts.map(p => ({ name: p.name, length: p.content.length })),
          });
        } else {
          console.warn('[Message API] Agent has no message_prompt, using default');
        }
      } else {
        console.warn('[Message API] Agent not found in database, using default prompt');
      }
    } catch (agentErr) {
      console.error('[Message API] Error fetching agent prompt:', agentErr);
      throw new HTTPException(500, {
        message: 'Failed to fetch agent details',
      });
    }

    // Initialize AI provider with user's BYOK key
    let model;
    try {
      const aiProvider = AiProviderService.new();
      model = await aiProvider.getAiProvider({
        modelInfo: getModelInfo('messageApi'),
        userApiKey,
      });
    } catch (providerErr: any) {
      console.error('[Message API] Error initializing AI provider:', providerErr);
      throw providerErr;
    }

    // Convert UIMessages to CoreMessages for the model
    const coreMessages = convertToModelMessages(messages);

    console.log('[Message API] Conversation messages:', coreMessages.length);

    // Stream text using full conversation history
    console.log('[Message API] Streaming response with:', {
      modelId: getModelConfig('messageApi').modelId,
      systemPromptLength: agentPrompt.length,
      messageCount: coreMessages.length,
    });

    const result = streamText({
      model,
      system: agentPrompt,
      messages: coreMessages,
      onError: async (e) => {
        console.error('[Message API] Stream error:', e);
      },
      onFinish: async (e) => {
        console.log('[Message API] Stream finished:', {
          responseLength: e.text?.length || 0,
          usage: e.usage,
          hasText: !!e.text && e.text.trim().length > 0,
        });

        if (e.text && e.text.trim().length > 0) {
          try {
            console.log('[Message API] Saving AI message...', {
              userId,
              agentId,
              contentLength: e.text.length,
            });

            await chatHelpers.saveAiMessage({
              userId,
              agentId,
              content: e.text,
              result: e,
              timezone,
            });

            console.log('[Message API] AI message saved successfully:', {
              agentId,
              contentLength: e.text.length,
              tokens: {
                input: e.usage?.inputTokens,
                output: e.usage?.outputTokens,
                total: e.usage?.totalTokens,
              },
            });

            // === SAVE TO MEM0 (ASYNC, DON'T BLOCK) ===
            if (userMessageContent.length > 20) {
              Mem0Client.add(
                [
                  { role: 'user', content: String(userMessageContent) },
                  { role: 'assistant', content: e.text },
                ],
                {
                  user_id: auth.userId,
                  agent_id: agentId,
                }
              )
                .then(() => {
                  console.log('[Message API] Memories saved to Mem0');
                })
                .catch((memErr) => {
                  console.error('[Message API] Failed to save memories:', memErr);
                  // Don't fail the request if memory save fails
                });
            }
          } catch (saveAiErr) {
            console.error('[Message API] Error saving AI message:', saveAiErr);
          }
        } else {
          console.warn('[Message API] Stream finished but no text to save');
        }
      },
    });

    // Convert to UI message stream response (v5 pattern)
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    return buildHonoErrorResponse(c, error);
  }
});

/**
 * POST /message/:agentId/welcome - Send personalized welcome message after onboarding
 * Streams a personalized welcome message based on user's onboarding insights
 */
app.post('/message/:agentId/welcome', async (c) => {
  try {
    const auth = getAuth(c);

    if (!auth?.userId) {
      console.error('[Welcome API] Unauthorized request');
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const agentId = c.req.param('agentId');
    if (!agentId) {
      console.error('[Welcome API] Missing agent ID');
      throw new HTTPException(400, { message: 'Agent ID is required' });
    }

    const { userId } = auth;
    console.log('[Welcome API] Generating welcome message for:', { userId, agentId });

    // Fetch onboarding insights
    const onboardingTableName = process.env.ONBOARDING_TABLE_NAME || 'onboarding-sessions';
    let insights = null;
    let agentName = 'AI Assistant';

    try {
      const onboardingResult = await db.send(
        new QueryCommand({
          TableName: onboardingTableName,
          KeyConditionExpression: 'user_id = :userId AND begins_with(composite_key, :agentPrefix)',
          ExpressionAttributeValues: {
            ':userId': userId,
            ':agentPrefix': `${agentId}#`,
          },
          ScanIndexForward: false,
          Limit: 1,
        })
      );

      if (onboardingResult.Items && onboardingResult.Items.length > 0) {
        const session = onboardingResult.Items[0];
        insights = session.insights;
        console.log('[Welcome API] Found onboarding insights:', { hasInsights: !!insights });
      }
    } catch (err) {
      console.error('[Welcome API] Error fetching onboarding insights:', err);
      // Continue without insights
    }

    // Fetch agent details
    try {
      const agentResult = await db.send(
        new QueryCommand({
          TableName: process.env.AGENTS_TABLE_NAME || 'agents',
          KeyConditionExpression: 'agent_id = :agentId',
          ExpressionAttributeValues: {
            ':agentId': agentId,
          },
          Limit: 1,
        })
      );

      if (agentResult.Items && agentResult.Items.length > 0) {
        agentName = agentResult.Items[0].name || agentName;
      }
    } catch (err) {
      console.error('[Welcome API] Error fetching agent:', err);
    }

    // Build personalized welcome prompt
    let welcomePrompt = `You are ${agentName}, a supportive and empathetic AI assistant. `;

    if (insights) {
      welcomePrompt += `\n\nYou've just completed an onboarding session with the user. Here's what you learned about them:\n\n`;
      welcomePrompt += `Summary: ${insights.summary}\n\n`;

      if (insights.preferences && insights.preferences.length > 0) {
        welcomePrompt += `Their preferences:\n`;
        insights.preferences.forEach((pref: string) => {
          welcomePrompt += `- ${pref}\n`;
        });
      }

      if (insights.personalityTraits && Object.keys(insights.personalityTraits).length > 0) {
        welcomePrompt += `\nKey personality traits:\n`;
        Object.entries(insights.personalityTraits).forEach(([trait, score]) => {
          welcomePrompt += `- ${trait}: ${score}/100\n`;
        });
      }

      welcomePrompt += `\n\nBased on this understanding, generate a warm, personalized welcome message (2-3 sentences) that:\n`;
      welcomePrompt += `1. Acknowledges their unique personality and preferences\n`;
      welcomePrompt += `2. Makes them feel understood and supported\n`;
      welcomePrompt += `3. Encourages them to share what's on their mind\n`;
      welcomePrompt += `4. Uses a tone that matches their communication style preferences\n\n`;
      welcomePrompt += `Be genuine, warm, and specific to their profile. Don't be generic.`;
    } else {
      welcomePrompt += `Generate a warm welcome message (2-3 sentences) that introduces yourself and invites the user to share what's on their mind.`;
    }

    // Fetch user's API key for BYOK
    let welcomeUserApiKey: string | undefined;
    try {
      const userResult = await db.send(
        new GetCommand({
          TableName: process.env.USERS_TABLE_NAME || 'users',
          Key: { user_id: userId },
          ProjectionExpression: 'byokApiKey',
        })
      );
      welcomeUserApiKey = userResult.Item?.byokApiKey;
    } catch (err) {
      console.error('[Welcome API] Error fetching user API key:', err);
    }

    if (!welcomeUserApiKey) {
      throw new HTTPException(403, {
        message: 'API key required. Please add your Google Gemini API key to continue.',
      });
    }

    // Initialize AI provider with user's BYOK key
    const aiProvider = AiProviderService.new();
    const model = await aiProvider.getAiProvider({
      modelInfo: getModelInfo('messageApi'),
      userApiKey: welcomeUserApiKey,
    });

    console.log('[Welcome API] Generating welcome message with AI');

    // Generate and stream welcome message
    const result = await streamText({
      model,
      messages: [
        {
          role: 'system',
          content: welcomePrompt,
        },
        {
          role: 'user',
          content: 'Generate the welcome message now.',
        },
      ],
      temperature: 0.8, // More creative for personalized welcome
      onFinish: async ({ text }) => {
        // Save the welcome message to chat history
        console.log('[Welcome API] Saving welcome message to history');
        const messagesTableName = process.env.MESSAGES_TABLE_NAME || 'messages';
        const chatHelpers = ChatHelpers.new({
          db,
          messagesTableName,
        });

        await chatHelpers.saveAiMessage({
          userId,
          agentId,
          content: text,
          result: {
            response: { timestamp: new Date() },
          },
        });

        console.log('[Welcome API] Welcome message saved successfully');
      },
    });

    // Convert to UI message stream response
    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('[Welcome API] Error:', error);
    return buildHonoErrorResponse(c, error);
  }
});

export default streamHandle(app) as any;
