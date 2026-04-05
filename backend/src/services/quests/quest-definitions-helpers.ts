/**
 * Helper functions for quest-definitions table
 * Handles reading and writing static quest data
 */

import { DynamoDBDocumentClient, QueryCommand, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import {
  QuestDefinition,
  QuestTask,
  QuestQuestion,
  CompleteQuestData,
} from './types';
import { QuestKeys } from './quest-utils';

const QUEST_DEFINITIONS_TABLE = process.env.QUEST_DEFINITIONS_TABLE_NAME || 'dev-quest-definitions';

// ========================================
// Read Operations
// ========================================

/**
 * Fetch complete quest definition (metadata, tasks, questions)
 */
export async function getQuestDefinition(
  db: DynamoDBDocumentClient,
  questId: string,
  version: number = 1
): Promise<CompleteQuestData | null> {
  const pk = QuestKeys.questPK(questId, version);

  const result = await db.send(
    new QueryCommand({
      TableName: QUEST_DEFINITIONS_TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': pk,
      },
    })
  );

  const items = result.Items || [];

  if (items.length === 0) {
    return null;
  }

  // Separate metadata, tasks, and questions
  const metadataSK = QuestKeys.questMetadataSK();
  const definition = items.find((item) => item.sk === metadataSK) as QuestDefinition | undefined;
  const tasks = items.filter((item) => item.sk.startsWith('TASK#')) as QuestTask[];
  const questions = items.filter((item) => item.sk.startsWith('QUESTION#')) as QuestQuestion[];

  if (!definition) {
    return null;
  }

  return {
    definition,
    tasks: tasks.sort((a, b) => a.order - b.order),
    questions: questions.sort((a, b) => a.order - b.order),
  };
}

/**
 * Fetch only quest metadata
 */
export async function getQuestMetadata(
  db: DynamoDBDocumentClient,
  questId: string,
  version: number = 1
): Promise<QuestDefinition | null> {
  const pk = QuestKeys.questPK(questId, version);
  const sk = QuestKeys.questMetadataSK();

  const result = await db.send(
    new QueryCommand({
      TableName: QUEST_DEFINITIONS_TABLE,
      KeyConditionExpression: 'pk = :pk AND sk = :sk',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': sk,
      },
    })
  );

  const item = result.Items?.[0];
  return item ? (item as QuestDefinition) : null;
}

/**
 * Fetch all tasks for a quest
 */
export async function getQuestTasks(
  db: DynamoDBDocumentClient,
  questId: string,
  version: number = 1
): Promise<QuestTask[]> {
  const pk = QuestKeys.questPK(questId, version);

  const result = await db.send(
    new QueryCommand({
      TableName: QUEST_DEFINITIONS_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':prefix': 'TASK#',
      },
    })
  );

  const tasks = (result.Items || []) as QuestTask[];
  return tasks.sort((a, b) => a.order - b.order);
}

/**
 * Fetch all questions for a specific task
 */
export async function getTaskQuestions(
  db: DynamoDBDocumentClient,
  questId: string,
  taskId: string,
  version: number = 1
): Promise<QuestQuestion[]> {
  const pk = QuestKeys.questPK(questId, version);
  const prefix = `QUESTION#${taskId}#`;

  const result = await db.send(
    new QueryCommand({
      TableName: QUEST_DEFINITIONS_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':prefix': prefix,
      },
    })
  );

  const questions = (result.Items || []) as QuestQuestion[];
  return questions.sort((a, b) => a.order - b.order);
}

// ========================================
// Write Operations
// ========================================

/**
 * Create or update quest metadata
 */
export async function putQuestMetadata(
  db: DynamoDBDocumentClient,
  metadata: Omit<QuestDefinition, 'pk' | 'sk'>
): Promise<void> {
  const pk = QuestKeys.questPK(metadata.questId, metadata.version);
  const sk = QuestKeys.questMetadataSK();

  const item: QuestDefinition = {
    pk,
    sk,
    ...metadata,
  };

  await db.send(
    new PutCommand({
      TableName: QUEST_DEFINITIONS_TABLE,
      Item: item,
    })
  );
}

/**
 * Create or update a task definition
 */
export async function putQuestTask(
  db: DynamoDBDocumentClient,
  questId: string,
  version: number,
  task: Omit<QuestTask, 'pk' | 'sk'>
): Promise<void> {
  const pk = QuestKeys.questPK(questId, version);
  const sk = QuestKeys.taskSK(task.taskId);

  const item: QuestTask = {
    pk,
    sk,
    ...task,
  };

  await db.send(
    new PutCommand({
      TableName: QUEST_DEFINITIONS_TABLE,
      Item: item,
    })
  );
}

/**
 * Create or update a question
 */
export async function putQuestQuestion(
  db: DynamoDBDocumentClient,
  questId: string,
  version: number,
  question: Omit<QuestQuestion, 'pk' | 'sk'>
): Promise<void> {
  const pk = QuestKeys.questPK(questId, version);
  const sk = QuestKeys.questionSK(question.taskId, question.questionId);

  const item: QuestQuestion = {
    pk,
    sk,
    ...question,
  };

  await db.send(
    new PutCommand({
      TableName: QUEST_DEFINITIONS_TABLE,
      Item: item,
    })
  );
}

/**
 * Batch write complete quest definition (metadata + tasks + questions)
 * Use this for initial quest setup
 */
export async function putCompleteQuestDefinition(
  db: DynamoDBDocumentClient,
  metadata: Omit<QuestDefinition, 'pk' | 'sk'>,
  tasks: Omit<QuestTask, 'pk' | 'sk'>[],
  questions: Omit<QuestQuestion, 'pk' | 'sk'>[]
): Promise<void> {
  const pk = QuestKeys.questPK(metadata.questId, metadata.version);

  // Build all items
  const allItems: any[] = [];

  // Metadata
  allItems.push({
    pk,
    sk: QuestKeys.questMetadataSK(),
    ...metadata,
  });

  // Tasks
  for (const task of tasks) {
    allItems.push({
      pk,
      sk: QuestKeys.taskSK(task.taskId),
      ...task,
    });
  }

  // Questions
  for (const question of questions) {
    allItems.push({
      pk,
      sk: QuestKeys.questionSK(question.taskId, question.questionId),
      ...question,
    });
  }

  // DynamoDB BatchWrite limit is 25 items per request
  const batches: any[][] = [];
  for (let i = 0; i < allItems.length; i += 25) {
    batches.push(allItems.slice(i, i + 25));
  }

  // Execute batches
  for (const batch of batches) {
    const writeRequests = batch.map((item) => ({
      PutRequest: { Item: item },
    }));

    await db.send(
      new BatchWriteCommand({
        RequestItems: {
          [QUEST_DEFINITIONS_TABLE]: writeRequests,
        },
      })
    );
  }
}
