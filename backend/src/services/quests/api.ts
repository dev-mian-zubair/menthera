import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { handle } from 'hono/aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { getAuth } from '@hono/clerk-auth';
import customClerkMiddleware from '../../shared/auth-middleware';
import {
  buildHonoSuccess,
  buildHonoErrorResponse,
} from '../../shared/utils/response-builder';
import {
  getQuestDefinition,
} from './quest-definitions-helpers';
import {
  createQuestSession,
  getQuestSession,
  getAgentQuestSessions,
  putQuestResponse,
  getSessionResponses,
  updateQuestSessionStatus,
  putTaskScore,
  getSessionScores,
  putInsight,
  getSessionInsights,
  getCompleteSessionData,
  calculateAndSaveScores,
} from './quest-sessions-helpers';
import {
  QuestSessionStatus,
  QuestQuestion,
  QuestTask,
  QuestResponse,
  CompleteQuestData,
} from './types';
import { reverseScore, normalizeScore, categorizeScore } from './quest-utils';
import { randomUUID } from 'crypto';

const app = new Hono();

app.use(logger());
app.use('*', customClerkMiddleware);
app.use('*', cors());

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);
const sqsClient = new SQSClient({});

const AGENTS_TABLE_NAME = process.env.AGENTS_TABLE_NAME || 'agents';
const QUEST_INSIGHTS_QUEUE_URL = process.env.QUEST_INSIGHTS_QUEUE_URL || '';

// ========================================
// GET /quests/:agentId - Fetch quest definition for agent (with session status)
// ========================================
app.get('/quests/:agentId', async (c) => {
  try {
    const auth = getAuth(c);
    if (!auth?.userId) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const userId = auth.userId;
    const agentId = c.req.param('agentId');

    // Fetch agent to get quest info
    // Since agents table has composite key (agent_id + agent_type), query by partition key
    const agentResult = await db.send(
      new QueryCommand({
        TableName: AGENTS_TABLE_NAME,
        KeyConditionExpression: 'agent_id = :agentId',
        ExpressionAttributeValues: {
          ':agentId': agentId,
        },
        Limit: 1,
      })
    );

    if (!agentResult.Items || agentResult.Items.length === 0) {
      throw new HTTPException(404, { message: 'Agent not found' });
    }

    const agent = agentResult.Items[0];

    // Get quest info from agent record
    const questId = agent.quest_id;
    const questVersion = agent.quest_version;

    if (!questId || !questVersion) {
      throw new HTTPException(404, { message: 'No quest configured for this agent' });
    }

    // Fetch quest definition
    const questData = await getQuestDefinition(db, questId, questVersion);

    if (!questData) {
      throw new HTTPException(404, { message: 'Quest not found for this agent' });
    }

    const { definition, tasks, questions } = questData;

    // Check for existing session
    const existingSessions = await getAgentQuestSessions(db, userId, agentId);

    let sessionStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    let sessionId: string | null = null;
    let currentTaskId: string | null = null;
    let completedAt: string | null = null;

    if (existingSessions.length > 0) {
      // Find in-progress session
      const inProgressSession = existingSessions.find(
        (s) => s.status === QuestSessionStatus.IN_PROGRESS
      );

      if (inProgressSession) {
        sessionStatus = 'in_progress';
        sessionId = inProgressSession.sk.split('#SESSION#')[1];

        // Get already answered questions to determine current task
        const responses = await getSessionResponses(db, userId, agentId, sessionId);
        const answeredQuestionIds = new Set(responses.map((r) => r.questionId));

        // Find first task that has unanswered questions
        const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
        for (const task of sortedTasks) {
          const taskQuestions = questions.filter((q) => q.taskId === task.taskId);
          const hasUnanswered = taskQuestions.some((q) => !answeredQuestionIds.has(q.questionId));
          if (hasUnanswered) {
            currentTaskId = task.taskId;
            break;
          }
        }
      } else {
        // Check for completed session
        const completedSession = existingSessions.find(
          (s) => s.status === QuestSessionStatus.COMPLETED
        );

        if (completedSession) {
          sessionStatus = 'completed';
          sessionId = completedSession.sk.split('#SESSION#')[1];
          completedAt = completedSession.completedAt || null;
        }
      }
    }

    // Format response
    const response = {
      quest: {
        questId: definition.questId,
        version: definition.version,
        title: definition.title,
        description: definition.description,
        teaser: definition.teaser,
        illustration: definition.illustration,
        estimatedTimeMinutes: definition.estimatedTimeMinutes,
        totalQuestions: questions.length,
        tasks: tasks.map((task) => ({
          taskId: task.taskId,
          title: task.title,
          description: task.description,
          illustration: task.illustration,
          framework: task.framework,
          order: task.order,
          questionCount: questions.filter((q) => q.taskId === task.taskId).length,
        })),
      },
      session: {
        status: sessionStatus,
        sessionId,
        currentTaskId,
        completedAt,
      },
    };

    console.log('[Quests API] GET QUEST DEFINITION COMPLETE RESPONSE:', JSON.stringify(response, null, 2));

    return buildHonoSuccess(c, response, 'Quest fetched successfully');
  } catch (error: any) {
    console.error('[Quests API] Error fetching quest:', error);
    return buildHonoErrorResponse(c, error);
  }
});

// ========================================
// POST /quests/:agentId/start - Start or resume quest
// ========================================
app.post('/quests/:agentId/start', async (c) => {
  try {
    const auth = getAuth(c);
    if (!auth?.userId) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const userId = auth.userId;
    const agentId = c.req.param('agentId');

    // Fetch agent to get quest info
    // Since agents table has composite key (agent_id + agent_type), query by partition key
    const agentResult = await db.send(
      new QueryCommand({
        TableName: AGENTS_TABLE_NAME,
        KeyConditionExpression: 'agent_id = :agentId',
        ExpressionAttributeValues: {
          ':agentId': agentId,
        },
        Limit: 1,
      })
    );

    if (!agentResult.Items || agentResult.Items.length === 0) {
      throw new HTTPException(404, { message: 'Agent not found' });
    }

    const agent = agentResult.Items[0];

    // Get quest info from agent record
    const questId = agent.quest_id;
    const questVersion = agent.quest_version;

    if (!questId || !questVersion) {
      throw new HTTPException(404, { message: 'No quest configured for this agent' });
    }

    // Fetch quest definition
    const questData = await getQuestDefinition(db, questId, questVersion);

    if (!questData) {
      throw new HTTPException(404, { message: 'Quest not found for this agent' });
    }

    const { questions, tasks } = questData;

    // Check for existing sessions
    const existingSessions = await getAgentQuestSessions(db, userId, agentId);

    let session;
    let currentTaskId: string | null = null;

    if (existingSessions.length > 0) {
      // Find in-progress session
      const inProgressSession = existingSessions.find(
        (s) => s.status === QuestSessionStatus.IN_PROGRESS
      );

      if (inProgressSession) {
        // Resume existing session
        const sessionId = inProgressSession.sk.split('#SESSION#')[1];
        session = inProgressSession;

        // Get already answered questions
        const responses = await getSessionResponses(db, userId, agentId, sessionId);
        const answeredQuestionIds = new Set(responses.map((r) => r.questionId));

        // Find first task that has unanswered questions
        const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
        for (const task of sortedTasks) {
          const taskQuestions = questions.filter((q) => q.taskId === task.taskId);
          const hasUnanswered = taskQuestions.some((q) => !answeredQuestionIds.has(q.questionId));
          if (hasUnanswered) {
            currentTaskId = task.taskId;
            break;
          }
        }
      } else {
        // Check if completed - don't allow restart
        const completedSession = existingSessions.find(
          (s) => s.status === QuestSessionStatus.COMPLETED
        );

        if (completedSession) {
          throw new HTTPException(400, {
            message: 'Quest already completed for this agent',
          });
        }

        // Create new session
        const sessionId = randomUUID();
        session = await createQuestSession(
          db,
          userId,
          agentId,
          questId,
          questVersion,
          sessionId
        );

        // Return first task
        const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
        currentTaskId = sortedTasks[0]?.taskId || null;
      }
    } else {
      // Create new session
      const sessionId = randomUUID();
      session = await createQuestSession(
        db,
        userId,
        agentId,
        questId,
        questVersion,
        sessionId
      );

      // Return first task
      const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
      currentTaskId = sortedTasks[0]?.taskId || null;
    }

    const sessionId = session.sk.split('#SESSION#')[1];

    // Build tasks with questions grouped
    const tasksWithQuestions = tasks
      .sort((a, b) => a.order - b.order)
      .map((task) => ({
        taskId: task.taskId,
        title: task.title,
        description: task.description,
        illustration: task.illustration,
        framework: task.framework,
        order: task.order,
        questions: questions
          .filter((q) => q.taskId === task.taskId)
          .sort((a, b) => a.order - b.order)
          .map((q) => ({
            questionId: q.questionId,
            text: q.text,
            scale: q.scale,
            isReverse: q.isReverse,
            domain: q.domain,
            order: q.order,
          })),
      }));

    const response = {
      session: {
        sessionId,
        questId: session.questId,
        questVersion: session.questVersion,
        status: session.status,
        currentTaskId,
      },
      tasks: tasksWithQuestions,
    };

    console.log('[Quests API] START SESSION COMPLETE RESPONSE:', JSON.stringify(response, null, 2));

    return buildHonoSuccess(c, response, 'Quest session started');
  } catch (error: any) {
    console.error('[Quests API] Error starting quest:', error);
    return buildHonoErrorResponse(c, error);
  }
});

// ========================================
// POST /quests/:agentId/submit - Submit task answers
// ========================================
app.post('/quests/:agentId/submit', async (c) => {
  try {
    const auth = getAuth(c);
    if (!auth?.userId) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const userId = auth.userId;
    const agentId = c.req.param('agentId');
    const body = await c.req.json();

    const { sessionId, taskId, answers } = body;

    console.log('[Quests API] SUBMIT TASK REQUEST:', JSON.stringify({
      userId,
      agentId,
      sessionId,
      taskId,
      answerCount: Array.isArray(answers) ? answers.length : 0,
      answers: Array.isArray(answers) ? answers : 'NOT_ARRAY',
    }, null, 2));

    // Validate input
    if (!sessionId || !taskId || !answers || !Array.isArray(answers)) {
      throw new HTTPException(400, { message: 'Missing required fields' });
    }

    if (answers.length === 0) {
      throw new HTTPException(400, { message: 'At least one answer is required' });
    }

    // Verify session exists and is in progress
    const session = await getQuestSession(db, userId, agentId, sessionId);

    if (!session) {
      throw new HTTPException(404, { message: 'Session not found' });
    }

    if (session.status !== QuestSessionStatus.IN_PROGRESS) {
      throw new HTTPException(400, { message: 'Session is not in progress' });
    }

    // Fetch quest definition
    const questData = await getQuestDefinition(db, session.questId, session.questVersion);

    if (!questData) {
      throw new HTTPException(404, { message: 'Quest not found' });
    }

    const { questions, tasks } = questData;

    // Get questions for this task
    const taskQuestions = questions.filter((q) => q.taskId === taskId);

    if (taskQuestions.length === 0) {
      throw new HTTPException(404, { message: 'Task not found' });
    }

    // Validate all questions in task are answered
    const submittedQuestionIds = new Set(answers.map((a) => a.questionId));
    const missingQuestions = taskQuestions.filter((q) => !submittedQuestionIds.has(q.questionId));

    if (missingQuestions.length > 0) {
      throw new HTTPException(400, {
        message: `Missing answers for questions: ${missingQuestions.map((q) => q.questionId).join(', ')}`,
      });
    }

    // Validate answer values
    for (const answer of answers) {
      if (answer.value < 1 || answer.value > 7) {
        throw new HTTPException(400, { message: `Invalid value ${answer.value} for question ${answer.questionId}. Must be between 1 and 7` });
      }
    }

    // Save all responses
    for (const answer of answers) {
      await putQuestResponse(db, userId, agentId, sessionId, taskId, answer.questionId, answer.value);
    }

    // Calculate score for this task immediately
    const taskResponses = answers.map((a) => ({
      taskId,
      questionId: a.questionId,
      value: a.value,
    })) as QuestResponse[];

    const task = tasks.find((t) => t.taskId === taskId);
    if (task) {
      console.log('[Quests API] Calculating scores for task:', taskId);
      await calculateAndSaveScores(db, userId, agentId, sessionId, [task], taskQuestions, taskResponses);
      console.log('[Quests API] Scores calculated and saved for task:', taskId);
    } else {
      console.error('[Quests API] Task not found for scoring:', taskId);
    }

    // Get all responses to check completion
    const allResponses = await getSessionResponses(db, userId, agentId, sessionId);
    const answeredQuestionIds = new Set(allResponses.map((r) => r.questionId));

    // Check if all tasks are complete
    const allQuestionsAnswered = questions.every((q) => answeredQuestionIds.has(q.questionId));

    if (allQuestionsAnswered) {
      // Mark session as completed
      const completedAt = new Date().toISOString();
      await updateQuestSessionStatus(
        db,
        userId,
        agentId,
        sessionId,
        QuestSessionStatus.COMPLETED,
        completedAt
      );

      // Store assessment results in users table for centralized user profile
      try {
        const sessionScores = await getSessionScores(db, userId, agentId, sessionId);

        if (sessionScores.length > 0) {
          const assessmentScores: Record<string, any> = {};

          for (const score of sessionScores) {
            const task = tasks.find((t) => t.taskId === score.taskId);
            const interpretation = task?.interpretations?.find(
              (interp) => interp.category === score.category
            );

            assessmentScores[score.taskId] = {
              rawScore: score.rawScore,
              normalizedScore: score.normalizedScore,
              category: score.category,
              label: interpretation?.label || score.category,
              description: interpretation?.description || '',
              framework: task?.framework || '',
            };
          }

          // Initialize assessments map if it doesn't exist
          await db.send(
            new UpdateCommand({
              TableName: process.env.USERS_TABLE_NAME || 'users',
              Key: { user_id: userId },
              UpdateExpression: 'SET #assessments = if_not_exists(#assessments, :emptyMap)',
              ExpressionAttributeNames: { '#assessments': 'assessments' },
              ExpressionAttributeValues: { ':emptyMap': {} },
            })
          );

          // Store assessment result for this agent
          await db.send(
            new UpdateCommand({
              TableName: process.env.USERS_TABLE_NAME || 'users',
              Key: { user_id: userId },
              UpdateExpression: 'SET #assessments.#agentId = :result, lastUpdated = :now',
              ExpressionAttributeNames: {
                '#assessments': 'assessments',
                '#agentId': agentId,
              },
              ExpressionAttributeValues: {
                ':result': {
                  questId: session.questId,
                  sessionId,
                  completedAt,
                  scores: assessmentScores,
                },
                ':now': new Date().toISOString(),
              },
            })
          );

          console.log('[Quests API] Assessment results stored in users table:', {
            userId,
            agentId,
            sessionId,
            scoreCount: Object.keys(assessmentScores).length,
          });
        }
      } catch (assessmentError) {
        // Log error but don't fail the request - assessment storage is not critical path
        console.error('[Quests API] Failed to store assessment results:', assessmentError);
      }

      // Trigger async insight generation via SQS
      if (QUEST_INSIGHTS_QUEUE_URL) {
        try {
          await sqsClient.send(
            new SendMessageCommand({
              QueueUrl: QUEST_INSIGHTS_QUEUE_URL,
              MessageBody: JSON.stringify({
                userId,
                agentId,
                sessionId,
                questId: session.questId,
                questVersion: session.questVersion,
                completedAt,
              }),
              MessageAttributes: {
                messageType: {
                  DataType: 'String',
                  StringValue: 'QUEST_COMPLETED',
                },
              },
            })
          );
          console.log('[Quests API] Insight generation queued for session:', sessionId);
        } catch (sqsError) {
          console.error('[Quests API] Failed to queue insight generation:', sqsError);
          // Don't fail the request if SQS fails - insights can be regenerated later
        }
      }

      const response = {
        submitted: true,
        nextTask: null,
        completion: {
          questCompleted: true,
          sessionId,
          completedAt,
          reportGenerating: true,
        },
      };

      console.log('[Quests API] SUBMIT TASK RESPONSE (COMPLETED):', JSON.stringify(response, null, 2));

      return buildHonoSuccess(c, response, 'Quest completed');
    } else {
      // Find next incomplete task
      const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
      const nextTask = sortedTasks.find((t) => {
        const tQuestions = questions.filter((q) => q.taskId === t.taskId);
        return tQuestions.some((q) => !answeredQuestionIds.has(q.questionId));
      });

      const response = {
        submitted: true,
        nextTask: nextTask
          ? {
              taskId: nextTask.taskId,
              title: nextTask.title,
              description: nextTask.description,
              illustration: nextTask.illustration,
              questionCount: questions.filter((q) => q.taskId === nextTask.taskId).length,
            }
          : null,
      };

      console.log('[Quests API] SUBMIT TASK RESPONSE (NEXT TASK):', JSON.stringify(response, null, 2));

      return buildHonoSuccess(c, response, 'Task submitted successfully');
    }
  } catch (error: any) {
    console.error('[Quests API] Error submitting task:', error);
    return buildHonoErrorResponse(c, error);
  }
});

// ========================================
// GET /quests/:agentId/report - Fetch quest report
// ========================================
app.get('/quests/:agentId/report', async (c) => {
  try {
    const auth = getAuth(c);
    if (!auth?.userId) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const userId = auth.userId;
    const agentId = c.req.param('agentId');
    const sessionIdParam = c.req.query('sessionId');

    // Get sessions for this agent
    const sessions = await getAgentQuestSessions(db, userId, agentId);

    if (sessions.length === 0) {
      throw new HTTPException(404, { message: 'No quest sessions found for this agent' });
    }

    // Find target session (most recent completed if not specified)
    let targetSession;
    if (sessionIdParam) {
      targetSession = sessions.find((s) => {
        const sid = s.sk.split('#SESSION#')[1];
        return sid === sessionIdParam && s.status === QuestSessionStatus.COMPLETED;
      });

      if (!targetSession) {
        throw new HTTPException(404, { message: 'Completed session not found' });
      }
    } else {
      // Get most recent completed session
      const completedSessions = sessions
        .filter((s) => s.status === QuestSessionStatus.COMPLETED)
        .sort((a, b) => {
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
          return bTime - aTime;
        });

      if (completedSessions.length === 0) {
        throw new HTTPException(404, { message: 'No completed sessions found' });
      }

      targetSession = completedSessions[0];
    }

    const sessionId = targetSession.sk.split('#SESSION#')[1];

    // Fetch complete session data
    const sessionData = await getCompleteSessionData(db, userId, agentId, sessionId);

    if (!sessionData) {
      throw new HTTPException(404, { message: 'Session data not found' });
    }

    const { session, insights } = sessionData;

    // Format report (single JSON record with structured sections)
    let reportData = null;
    if (insights && insights.length > 0) {
      const reportInsight = insights.find((i) => i.insightType === 'report');

      if (reportInsight) {
        try {
          // Parse the complete report JSON
          const parsedReport = JSON.parse(reportInsight.content);
          reportData = {
            title: parsedReport.title,
            description: parsedReport.description,
            sections: parsedReport.sections, // Array of { id, title, icon, content, order }
            generatedAt: reportInsight.createdAt,
            model: reportInsight.model,
          };
        } catch (error) {
          console.error('[Quests API] Error parsing report JSON:', error);
        }
      }
    }

    const response = {
      report: {
        sessionId,
        questId: session.questId,
        questVersion: session.questVersion,
        completedAt: session.completedAt,
        reportData,
        reportReady: reportData !== null,
      },
    };

    return buildHonoSuccess(c, response, 'Report fetched successfully');
  } catch (error: any) {
    console.error('[Quests API] Error fetching report:', error);
    return buildHonoErrorResponse(c, error);
  }
});

export default handle(app);
