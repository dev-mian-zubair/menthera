import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const growthMindsetTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'growth_mindset',
  title: 'Unleash Your Growth Potential',
  description: 'Find out if you see your abilities as fixed or expandable and discover how your mindset shapes your career success. Learn how embracing challenges and viewing failure as feedback can unlock unlimited growth.',
  illustration: 'growth',
  framework: "Dweck's Mindset Theory",
  order: 3,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: ['gm_q4'],
    ranges: {
      fixed: [1, 3.5],
      mixed: [3.51, 5.5],
      growth: [5.51, 7],
    },
  },
  interpretations: [
    {
      category: 'fixed',
      range: [1, 3.5],
      label: 'Awakening Possibility',
      description: 'You are about to discover something powerful: your abilities are not fixed. With practice and effort, you can grow in ways you never imagined possible.',
      traits: [
        'Ready to embrace growth',
        'Learning to see failure as feedback',
        'Beginning to take on challenges',
        'Discovering your potential',
      ],
      recommendations: [
        'Reframe failures as learning opportunities, not character flaws',
        'Practice a new skill deliberately to experience growth',
        'Read "Mindset" by Carol Dweck to understand mindset shifts',
        'Celebrate effort and progress, not just outcomes',
      ],
    },
    {
      category: 'mixed',
      range: [3.51, 5.5],
      label: 'Expanding Horizons',
      description: 'Your growth mindset is developing. You believe in your potential in many areas—and you are ready to extend that belief to new challenges.',
      traits: [
        'Growing in many areas',
        'Developing growth orientation',
        'Becoming more challenge-seeking',
        'Expanding belief in self',
      ],
      recommendations: [
        'Identify specific areas where you feel stuck or limited',
        'Apply growth mindset language: "I can\'t do this yet"',
        'Seek feedback actively and view it as information, not judgment',
        'Challenge limiting beliefs with evidence of past learning',
      ],
    },
    {
      category: 'growth',
      range: [5.51, 7],
      label: 'Limitless Mindset',
      description: 'You have unlocked the growth mindset. Challenges excite you, failure teaches you, and effort is your path to mastery. Your potential has no ceiling.',
      traits: [
        'Believes in unlimited development',
        'Embraces challenges eagerly',
        'Transforms failure into learning',
        'Unstoppable persistence',
      ],
      recommendations: [
        'Continue seeking stretch assignments that push your capabilities',
        'Mentor others to help them develop growth mindsets',
        'Set learning goals alongside performance goals',
        'Reflect regularly on your growth journey and lessons learned',
      ],
    },
  ],
};

export const growthMindsetQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'growth_mindset',
    questionId: 'gm_q1',
    text: 'My abilities and talents can be developed through effort and practice.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'belief_development',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'growth_mindset',
    questionId: 'gm_q2',
    text: 'Challenges at work are opportunities to grow, not threats.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'challenge_response',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'growth_mindset',
    questionId: 'gm_q3',
    text: 'When I fail, I see it as a chance to learn rather than a reflection of my limits.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'failure_response',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'growth_mindset',
    questionId: 'gm_q4',
    text: 'I believe intelligence and skills are mostly fixed traits.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'fixed_belief',
    order: 4,
  },
];
