import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const locusOfControlTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'locus_of_control',
  title: 'Master Your Financial Destiny',
  description: 'Discover whether you see yourself as the driver of your financial future or if you feel controlled by external forces. Learn how to take ownership of your financial outcomes and build unstoppable agency.',
  illustration: 'compass',
  framework: 'Financial Locus of Control Scale',
  order: 3,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: [],
    ranges: {
      external: [1, 3],
      moderate: [3.01, 5],
      internal: [5.01, 7],
    },
  },
  interpretations: [
    {
      category: 'external',
      range: [1, 3],
      label: 'Discovering Your Power',
      description: 'You are ready to realize how much control you actually have over your financial future. Small, consistent actions create big results—and you are about to experience that power.',
      traits: [
        'Ready to claim financial agency',
        'Learning the action-outcome connection',
        'Building proactive mindset',
        'Primed for empowerment',
      ],
      recommendations: [
        'Track small financial wins to build sense of agency',
        'Set controllable micro-goals (e.g., save $50 this week)',
        'Learn about financial decision-making through case studies',
        'Work with a financial coach to identify areas of control',
      ],
    },
    {
      category: 'moderate',
      range: [3.01, 5],
      label: 'Grounded Ownership',
      description: 'You hold a wise balance—taking ownership where you can while accepting what lies beyond your control. This realistic perspective supports sustainable financial progress.',
      traits: [
        'Realistic about influence',
        'Accepts external factors gracefully',
        'Takes meaningful action',
        'Adapts to changing circumstances',
      ],
      recommendations: [
        'Continue strengthening your financial decision-making skills',
        'Build contingency plans for external factors you cannot control',
        'Celebrate your successes while learning from setbacks',
        'Maintain flexibility in your financial strategies',
      ],
    },
    {
      category: 'internal',
      range: [5.01, 7],
      label: 'Captain of Your Ship',
      description: 'You own your financial destiny. Your strong belief that your choices shape your outcomes drives proactive planning and confident decision-making.',
      traits: [
        'Powerful sense of financial agency',
        'Proactive and intentional',
        'Fully accountable for outcomes',
        'Confident financial decision-maker',
      ],
      recommendations: [
        'Channel your agency into systematic financial planning',
        'Be mindful of external factors beyond your control',
        'Share your proactive approach with others',
        'Set challenging but achievable financial milestones',
      ],
    },
  ],
};

export const locusOfControlQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'locus_of_control',
    questionId: 'loc_q1',
    text: 'My financial situation is mostly determined by my own actions.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'internal_control',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'locus_of_control',
    questionId: 'loc_q2',
    text: 'I can control my financial future through planning and discipline.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'financial_agency',
    order: 2,
  },
];
