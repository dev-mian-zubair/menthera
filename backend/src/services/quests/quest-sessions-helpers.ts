/**
 * Helper functions for quest-sessions table
 * Handles user quest execution, answers, scores, and insights
 */

import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  QuestSession,
  QuestResponse,
  QuestScore,
  QuestInsight,
  QuestSessionStatus,
  QuestEntity,
  AgentQuestStatus,
  CompleteSessionData,
  InsightType,
  QuestTask,
  QuestQuestion,
} from './types';
import { QuestKeys, reverseScore, normalizeScore, categorizeScore } from './quest-utils';

const QUEST_SESSIONS_TABLE = process.env.QUEST_SESSIONS_TABLE_NAME || 'dev-quest-sessions';

// ========================================
// Session Operations
// ========================================

/**
 * Create a new quest session
 */
export async function createQuestSession(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  questId: string,
  questVersion: number,
  sessionId: string
): Promise<QuestSession> {
  const pk = QuestKeys.userPK(userId);
  const sk = QuestKeys.sessionSK(agentId, sessionId);

  const session: QuestSession = {
    pk,
    sk,
    entity: QuestEntity.SESSION,
    userId,
    agentId,
    questId,
    questVersion,
    status: QuestSessionStatus.IN_PROGRESS,
    startedAt: new Date().toISOString(),
    expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days TTL
  };

  await db.send(
    new PutCommand({
      TableName: QUEST_SESSIONS_TABLE,
      Item: session,
    })
  );

  return session;
}

/**
 * Get quest session
 */
export async function getQuestSession(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  sessionId: string
): Promise<QuestSession | null> {
  const pk = QuestKeys.userPK(userId);
  const sk = QuestKeys.sessionSK(agentId, sessionId);

  const result = await db.send(
    new GetCommand({
      TableName: QUEST_SESSIONS_TABLE,
      Key: { pk, sk },
    })
  );

  return result.Item ? (result.Item as QuestSession) : null;
}

/**
 * Update quest session status
 */
export async function updateQuestSessionStatus(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  sessionId: string,
  status: QuestSessionStatus,
  completedAt?: string
): Promise<void> {
  const pk = QuestKeys.userPK(userId);
  const sk = QuestKeys.sessionSK(agentId, sessionId);

  const updateExpression = completedAt
    ? 'SET #status = :status, completedAt = :completedAt'
    : 'SET #status = :status';

  const expressionAttributeValues: any = {
    ':status': status,
  };

  if (completedAt) {
    expressionAttributeValues[':completedAt'] = completedAt;
  }

  await db.send(
    new UpdateCommand({
      TableName: QUEST_SESSIONS_TABLE,
      Key: { pk, sk },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

/**
 * Update quest session reportReady flag
 */
export async function updateQuestSessionReportReady(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  sessionId: string,
  reportReady: boolean
): Promise<void> {
  const pk = QuestKeys.userPK(userId);
  const sk = QuestKeys.sessionSK(agentId, sessionId);

  await db.send(
    new UpdateCommand({
      TableName: QUEST_SESSIONS_TABLE,
      Key: { pk, sk },
      UpdateExpression: 'SET reportReady = :reportReady, reportReadyAt = :reportReadyAt',
      ExpressionAttributeValues: {
        ':reportReady': reportReady,
        ':reportReadyAt': new Date().toISOString(),
      },
    })
  );
}

/**
 * Get all quest sessions for a user-agent pair
 */
export async function getAgentQuestSessions(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string
): Promise<QuestSession[]> {
  const pk = QuestKeys.userPK(userId);
  const prefix = QuestKeys.agentSessionsPrefix(agentId);

  const result = await db.send(
    new QueryCommand({
      TableName: QUEST_SESSIONS_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      FilterExpression: 'entity = :entity',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':prefix': prefix,
        ':entity': QuestEntity.SESSION,
      },
    })
  );

  return (result.Items || []) as QuestSession[];
}

/**
 * Get quest completion status for a user-agent pair (most recent completed session)
 */
export async function getAgentQuestStatus(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string
): Promise<AgentQuestStatus> {
  const sessions = await getAgentQuestSessions(db, userId, agentId);

  if (sessions.length === 0) {
    return {
      agentId,
      completed: false,
      status: 'not_started',
    };
  }

  // Find most recent completed session
  const completedSessions = sessions
    .filter((s) => s.status === QuestSessionStatus.COMPLETED)
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });

  if (completedSessions.length > 0) {
    const latest = completedSessions[0];
    return {
      agentId,
      completed: true,
      status: QuestSessionStatus.COMPLETED,
      completedAt: latest.completedAt,
      sessionId: latest.userId, // Extract sessionId from sk
    };
  }

  // Check for in-progress session
  const inProgressSession = sessions.find((s) => s.status === QuestSessionStatus.IN_PROGRESS);
  if (inProgressSession) {
    return {
      agentId,
      completed: false,
      status: QuestSessionStatus.IN_PROGRESS,
      sessionId: inProgressSession.userId,
    };
  }

  return {
    agentId,
    completed: false,
    status: 'not_started',
  };
}

// ========================================
// Response Operations
// ========================================

/**
 * Save user response to a question
 */
export async function putQuestResponse(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  sessionId: string,
  taskId: string,
  questionId: string,
  value: number
): Promise<QuestResponse> {
  const pk = QuestKeys.userPK(userId);
  const sk = QuestKeys.responseSK(agentId, sessionId, taskId, questionId);

  const response: QuestResponse = {
    pk,
    sk,
    entity: QuestEntity.RESPONSE,
    taskId,
    questionId,
    value,
    answeredAt: new Date().toISOString(),
  };

  await db.send(
    new PutCommand({
      TableName: QUEST_SESSIONS_TABLE,
      Item: response,
    })
  );

  return response;
}

/**
 * Get all responses for a session
 */
export async function getSessionResponses(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  sessionId: string
): Promise<QuestResponse[]> {
  const pk = QuestKeys.userPK(userId);
  const prefix = QuestKeys.sessionPrefix(agentId, sessionId);

  const result = await db.send(
    new QueryCommand({
      TableName: QUEST_SESSIONS_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      FilterExpression: 'entity = :entity',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':prefix': prefix,
        ':entity': QuestEntity.RESPONSE,
      },
    })
  );

  return (result.Items || []) as QuestResponse[];
}

// ========================================
// Score Operations
// ========================================

/**
 * Save task score
 */
export async function putTaskScore(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  sessionId: string,
  taskId: string,
  rawScore: number,
  normalizedScore: number,
  category: string
): Promise<QuestScore> {
  const pk = QuestKeys.userPK(userId);
  const sk = QuestKeys.scoreSK(agentId, sessionId, taskId);

  const score: QuestScore = {
    pk,
    sk,
    entity: QuestEntity.SCORE,
    taskId,
    rawScore,
    normalizedScore,
    category,
    computedAt: new Date().toISOString(),
  };

  await db.send(
    new PutCommand({
      TableName: QUEST_SESSIONS_TABLE,
      Item: score,
    })
  );

  return score;
}

/**
 * Get all scores for a session
 */
export async function getSessionScores(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  sessionId: string
): Promise<QuestScore[]> {
  const pk = QuestKeys.userPK(userId);
  const prefix = QuestKeys.sessionPrefix(agentId, sessionId);

  const result = await db.send(
    new QueryCommand({
      TableName: QUEST_SESSIONS_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      FilterExpression: 'entity = :entity',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':prefix': prefix,
        ':entity': QuestEntity.SCORE,
      },
    })
  );

  return (result.Items || []) as QuestScore[];
}

// ========================================
// Insight Operations
// ========================================

/**
 * Save insight
 */
export async function putInsight(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  sessionId: string,
  insightType: InsightType,
  content: string,
  model: string
): Promise<QuestInsight> {
  const pk = QuestKeys.userPK(userId);
  const sk = QuestKeys.insightSK(agentId, sessionId, insightType);

  const insight: QuestInsight = {
    pk,
    sk,
    entity: QuestEntity.INSIGHT,
    insightType,
    content,
    model,
    createdAt: new Date().toISOString(),
  };

  await db.send(
    new PutCommand({
      TableName: QUEST_SESSIONS_TABLE,
      Item: insight,
    })
  );

  return insight;
}

/**
 * Get all insights for a session
 */
export async function getSessionInsights(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  sessionId: string
): Promise<QuestInsight[]> {
  const pk = QuestKeys.userPK(userId);
  const prefix = QuestKeys.sessionPrefix(agentId, sessionId);

  const result = await db.send(
    new QueryCommand({
      TableName: QUEST_SESSIONS_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      FilterExpression: 'entity = :entity',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':prefix': prefix,
        ':entity': QuestEntity.INSIGHT,
      },
    })
  );

  return (result.Items || []) as QuestInsight[];
}

// ========================================
// Scoring Helpers
// ========================================

/**
 * Calculate and save scores for tasks
 * Used during task submission to immediately calculate scores
 */
export async function calculateAndSaveScores(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  sessionId: string,
  tasks: QuestTask[],
  questions: QuestQuestion[],
  responses: QuestResponse[]
): Promise<void> {
  for (const task of tasks) {
    // Get all questions for this task
    const taskQuestions = questions.filter((q) => q.taskId === task.taskId);

    // Get all responses for this task
    const taskResponses = responses.filter((r) => r.taskId === task.taskId);

    // Skip if not all questions answered
    if (taskResponses.length !== taskQuestions.length) {
      continue;
    }

    // Calculate raw score (average of responses, with reverse scoring)
    let sum = 0;
    for (const response of taskResponses) {
      const question = taskQuestions.find((q) => q.questionId === response.questionId);
      if (!question) continue;

      const value = question.isReverse
        ? reverseScore(response.value, task.scoringLogic.scale)
        : response.value;
      sum += value;
    }

    const rawScore = sum / taskResponses.length;

    // Normalize to 0-100 scale
    const normalizedScore = normalizeScore(rawScore, task.scoringLogic.scale);

    // Categorize based on RAW score (ranges are defined in 1-7 scale, not 0-100)
    const category = categorizeScore(rawScore, task.scoringLogic.ranges);

    // Save score
    await putTaskScore(db, userId, agentId, sessionId, task.taskId, rawScore, normalizedScore, category);
  }
}

// ========================================
// Complete Session Data
// ========================================

/**
 * Get complete session data (session + responses + scores + insights)
 */
export async function getCompleteSessionData(
  db: DynamoDBDocumentClient,
  userId: string,
  agentId: string,
  sessionId: string
): Promise<CompleteSessionData | null> {
  const pk = QuestKeys.userPK(userId);
  const prefix = QuestKeys.sessionPrefix(agentId, sessionId);

  // Query all data for this session
  const result = await db.send(
    new QueryCommand({
      TableName: QUEST_SESSIONS_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':prefix': prefix,
      },
    })
  );

  const items = result.Items || [];

  if (items.length === 0) {
    return null;
  }

  // Separate different entity types
  const session = items.find((item) => item.entity === QuestEntity.SESSION) as QuestSession | undefined;
  const responses = items.filter((item) => item.entity === QuestEntity.RESPONSE) as QuestResponse[];
  const scores = items.filter((item) => item.entity === QuestEntity.SCORE) as QuestScore[];
  const insights = items.filter((item) => item.entity === QuestEntity.INSIGHT) as QuestInsight[];

  if (!session) {
    return null;
  }

  return {
    session,
    responses,
    scores,
    insights,
  };
}
