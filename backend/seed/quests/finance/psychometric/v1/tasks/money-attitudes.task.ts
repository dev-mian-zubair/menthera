import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const moneyAttitudesTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'money_attitudes',
  title: 'Unlock Your Money Mindset',
  description: 'Explore your deep-seated beliefs about money and discover whether you operate from scarcity, balance, or abundance. Transform your relationship with finances by understanding the hidden scripts that drive your decisions.',
  illustration: 'brain',
  framework: 'Klontz Money Scripts',
  order: 2,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: ['ma_q2'],
    ranges: {
      scarcity: [1, 3],
      balanced: [3.01, 5],
      abundance: [5.01, 7],
    },
  },
  interpretations: [
    {
      category: 'scarcity',
      range: [1, 3],
      label: 'Unlocking Abundance',
      description: 'You are ready to transform your relationship with money. Right now, scarcity thinking may dominate—but you have the power to rewrite your financial story.',
      traits: [
        'Ready to shift money mindset',
        'Developing financial confidence',
        'Learning to trust the process',
        'Transforming relationship with money',
      ],
      recommendations: [
        'Challenge negative money beliefs with evidence of your financial resilience',
        'Practice gratitude for current financial resources',
        'Work with a financial therapist to explore money scripts',
        'Set small, achievable financial goals to build confidence',
      ],
    },
    {
      category: 'balanced',
      range: [3.01, 5],
      label: 'Grounded Money Wisdom',
      description: 'You hold a healthy, realistic relationship with money. You see it as a tool—neither a source of anxiety nor obsession—and balance present enjoyment with future planning.',
      traits: [
        'Practical view of money',
        'Emotionally balanced around finances',
        'Balances present and future needs',
        'Money serves you, not vice versa',
      ],
      recommendations: [
        'Continue cultivating awareness of money beliefs',
        'Diversify your financial education through books and courses',
        'Review and adjust financial goals quarterly',
        'Share healthy money attitudes with family members',
      ],
    },
    {
      category: 'abundance',
      range: [5.01, 7],
      label: 'Abundance Mindset',
      description: 'You have cultivated a powerful relationship with money. Opportunities flow toward you because you see them—your confidence and optimism create financial momentum.',
      traits: [
        'Confident about financial future',
        'Natural money management abilities',
        'Sees money as flowing and renewable',
        'Magnetizes financial opportunities',
      ],
      recommendations: [
        'Leverage your confidence to mentor others on financial wellness',
        'Ensure optimism is balanced with realistic risk assessment',
        'Explore investment opportunities aligned with your values',
        'Use your abundance mindset to set ambitious financial goals',
      ],
    },
  ],
};

export const moneyAttitudesQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'money_attitudes',
    questionId: 'ma_q1',
    text: 'I believe there will always be enough money for the things I need.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'money_abundance',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'money_attitudes',
    questionId: 'ma_q2',
    text: 'Money is the root of most problems in life.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'money_avoidance',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'money_attitudes',
    questionId: 'ma_q3',
    text: 'I feel confident managing my financial future.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'financial_confidence',
    order: 3,
  },
];
