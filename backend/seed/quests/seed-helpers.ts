import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { QuestDefinition, QuestTask, QuestQuestion } from '../../src/services/quests/types';
import { putCompleteQuestDefinition } from '../../src/services/quests/quest-definitions-helpers';

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

interface QuestSeedData {
  meta: Omit<QuestDefinition, 'pk' | 'sk'>;
  tasks: Array<{
    task: Omit<QuestTask, 'pk' | 'sk'>;
    questions: Omit<QuestQuestion, 'pk' | 'sk'>[];
  }>;
}

/**
 * Seed a quest definition into DynamoDB
 */
export async function seedQuest(questData: QuestSeedData): Promise<void> {
  console.log(`[Quest Seeder] Seeding quest: ${questData.meta.questId} v${questData.meta.version}`);

  const tasks = questData.tasks.map(t => t.task);
  const questions = questData.tasks.flatMap(t => t.questions);

  console.log(`[Quest Seeder] - ${tasks.length} tasks`);
  console.log(`[Quest Seeder] - ${questions.length} questions`);

  try {
    await putCompleteQuestDefinition(
      db,
      questData.meta,
      tasks,
      questions
    );

    console.log(`[Quest Seeder] ✅ Successfully seeded ${questData.meta.questId} v${questData.meta.version}`);
  } catch (error) {
    console.error(`[Quest Seeder] ❌ Failed to seed ${questData.meta.questId}:`, error);
    throw error;
  }
}

/**
 * Seed multiple quests
 */
export async function seedQuests(quests: QuestSeedData[]): Promise<void> {
  console.log(`[Quest Seeder] Starting to seed ${quests.length} quest(s)...`);

  for (const quest of quests) {
    await seedQuest(quest);
  }

  console.log(`[Quest Seeder] ✅ All quests seeded successfully!`);
}
