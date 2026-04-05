#!/usr/bin/env node

/**
 * Quest Seed Runner
 *
 * Usage:
 *   npm run seed:quests
 *
 * This script seeds all quest definitions into the quest-definitions table.
 */

import { seedQuests } from './quests/seed-helpers';

// Finance Quest
import { financeQuestMeta } from './quests/finance/psychometric/v1/quest.meta';
import { riskToleranceTask, riskToleranceQuestions } from './quests/finance/psychometric/v1/tasks/risk-tolerance.task';
import { moneyAttitudesTask, moneyAttitudesQuestions } from './quests/finance/psychometric/v1/tasks/money-attitudes.task';
import { locusOfControlTask, locusOfControlQuestions } from './quests/finance/psychometric/v1/tasks/locus-of-control.task';
import { financialBehaviorTask, financialBehaviorQuestions } from './quests/finance/psychometric/v1/tasks/financial-behavior.task';

// Career Quest
import { careerQuestMeta } from './quests/career/psychometric/v1/quest.meta';
import { workPersonalityTask, workPersonalityQuestions } from './quests/career/psychometric/v1/tasks/work-personality.task';
import { careerMotivationTask, careerMotivationQuestions } from './quests/career/psychometric/v1/tasks/career-motivation.task';
import { growthMindsetTask, growthMindsetQuestions } from './quests/career/psychometric/v1/tasks/growth-mindset.task';
import { careerAdaptabilityTask, careerAdaptabilityQuestions } from './quests/career/psychometric/v1/tasks/career-adaptability.task';

// Wellness Quest
import { wellnessQuestMeta } from './quests/wellness/psychometric/v1/quest.meta';
import { emotionalRegulationTask, emotionalRegulationQuestions } from './quests/wellness/psychometric/v1/tasks/emotional-regulation.task';
import { stressResponseTask, stressResponseQuestions } from './quests/wellness/psychometric/v1/tasks/stress-response.task';
import { mindfulnessTask, mindfulnessQuestions } from './quests/wellness/psychometric/v1/tasks/mindfulness.task';
import { resilienceTask, resilienceQuestions } from './quests/wellness/psychometric/v1/tasks/resilience.task';

// Relationships Quest
import { relationshipsQuestMeta } from './quests/relationships/psychometric/v1/quest.meta';
import { attachmentStyleTask, attachmentStyleQuestions } from './quests/relationships/psychometric/v1/tasks/attachment-style.task';
import { emotionalIntelligenceTask, emotionalIntelligenceQuestions } from './quests/relationships/psychometric/v1/tasks/emotional-intelligence.task';
import { communicationStyleTask, communicationStyleQuestions } from './quests/relationships/psychometric/v1/tasks/communication-style.task';
import { empathyTask, empathyQuestions } from './quests/relationships/psychometric/v1/tasks/empathy.task';

// Health Quest
import { healthQuestMeta } from './quests/health/psychometric/v1/quest.meta';
import { exerciseMotivationTask, exerciseMotivationQuestions } from './quests/health/psychometric/v1/tasks/exercise-motivation.task';
import { selfEfficacyTask, selfEfficacyQuestions } from './quests/health/psychometric/v1/tasks/self-efficacy.task';
import { healthLocusControlTask, healthLocusControlQuestions } from './quests/health/psychometric/v1/tasks/health-locus-control.task';
import { activityReadinessTask, activityReadinessQuestions } from './quests/health/psychometric/v1/tasks/activity-readiness.task';

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║     Menthera Quest Seeder v1.0.0          ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  const quests = [
    // Finance Quest (Agent 1: Fin)
    {
      meta: financeQuestMeta,
      tasks: [
        {
          task: riskToleranceTask,
          questions: riskToleranceQuestions,
        },
        {
          task: moneyAttitudesTask,
          questions: moneyAttitudesQuestions,
        },
        {
          task: locusOfControlTask,
          questions: locusOfControlQuestions,
        },
        {
          task: financialBehaviorTask,
          questions: financialBehaviorQuestions,
        },
      ],
    },
    // Career Quest (Agent 2: Lexa)
    {
      meta: careerQuestMeta,
      tasks: [
        {
          task: workPersonalityTask,
          questions: workPersonalityQuestions,
        },
        {
          task: careerMotivationTask,
          questions: careerMotivationQuestions,
        },
        {
          task: growthMindsetTask,
          questions: growthMindsetQuestions,
        },
        {
          task: careerAdaptabilityTask,
          questions: careerAdaptabilityQuestions,
        },
      ],
    },
    // Wellness Quest (Agent 3: Seren)
    {
      meta: wellnessQuestMeta,
      tasks: [
        {
          task: emotionalRegulationTask,
          questions: emotionalRegulationQuestions,
        },
        {
          task: stressResponseTask,
          questions: stressResponseQuestions,
        },
        {
          task: mindfulnessTask,
          questions: mindfulnessQuestions,
        },
        {
          task: resilienceTask,
          questions: resilienceQuestions,
        },
      ],
    },
    // Relationships Quest (Agent 4: Relia)
    {
      meta: relationshipsQuestMeta,
      tasks: [
        {
          task: attachmentStyleTask,
          questions: attachmentStyleQuestions,
        },
        {
          task: emotionalIntelligenceTask,
          questions: emotionalIntelligenceQuestions,
        },
        {
          task: communicationStyleTask,
          questions: communicationStyleQuestions,
        },
        {
          task: empathyTask,
          questions: empathyQuestions,
        },
      ],
    },
    // Health Quest (Agent 5: Physa)
    {
      meta: healthQuestMeta,
      tasks: [
        {
          task: exerciseMotivationTask,
          questions: exerciseMotivationQuestions,
        },
        {
          task: selfEfficacyTask,
          questions: selfEfficacyQuestions,
        },
        {
          task: healthLocusControlTask,
          questions: healthLocusControlQuestions,
        },
        {
          task: activityReadinessTask,
          questions: activityReadinessQuestions,
        },
      ],
    },
  ];

  try {
    await seedQuests(quests);
    console.log('\n✅ Quest seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Quest seeding failed:', error);
    process.exit(1);
  }
}

main();
