import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const financialBehaviorTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'financial_behavior',
  title: 'Elevate Your Money Habits',
  description: 'Find out if you are a reactive responder, developing planner, or proactive financial master. Discover your financial behavior patterns and learn how to build the disciplined habits that create lasting wealth.',
  illustration: 'chart-line',
  framework: 'OECD Financial Behavior Framework',
  order: 4,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: [],
    ranges: {
      reactive: [1, 3],
      moderate: [3.01, 5],
      proactive: [5.01, 7],
    },
  },
  interpretations: [
    {
      category: 'reactive',
      range: [1, 3],
      label: 'Ready to Take Control',
      description: 'You are at the beginning of building strong financial habits. The awareness you gain from this assessment is the first step toward systematic money management.',
      traits: [
        'Ready to develop financial systems',
        'Learning to plan ahead',
        'Building budgeting foundations',
        'Primed for financial growth',
      ],
      recommendations: [
        'Start with simple budgeting using apps like Mint or YNAB',
        'Set one monthly financial goal and track progress',
        'Automate savings transfers to build consistency',
        'Schedule quarterly financial check-ins with yourself',
      ],
    },
    {
      category: 'moderate',
      range: [3.01, 5],
      label: 'Building Momentum',
      description: 'Your financial habits are taking shape. You are developing real systems and growing more intentional about money—the foundation of lasting wealth is forming.',
      traits: [
        'Developing consistent habits',
        'Growing financial awareness',
        'Building planning muscles',
        'Momentum accelerating',
      ],
      recommendations: [
        'Expand financial knowledge through courses or books',
        'Create written financial goals for 1, 5, and 10 years',
        'Review and refine your budget monthly',
        'Consider working with a financial advisor for guidance',
      ],
    },
    {
      category: 'proactive',
      range: [5.01, 7],
      label: 'Financial Master',
      description: 'You have built powerful financial habits. Planning, tracking, and goal-setting come naturally—your disciplined approach is creating lasting wealth.',
      traits: [
        'Mastered financial planning',
        'Consistent money management',
        'Long-term vision in action',
        'Financially literate and proactive',
      ],
      recommendations: [
        'Optimize your investment strategy with tax-advantaged accounts',
        'Consider advanced strategies like tax-loss harvesting',
        'Mentor others who want to improve financial behaviors',
        'Review and rebalance portfolio semi-annually',
      ],
    },
  ],
};

export const financialBehaviorQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'financial_behavior',
    questionId: 'fb_q1',
    text: 'I actively monitor my spending and budget regularly.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'budgeting',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'financial_behavior',
    questionId: 'fb_q2',
    text: 'I set long-term financial goals and work towards them.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'goal_setting',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'financial_behavior',
    questionId: 'fb_q3',
    text: 'I research financial products before making decisions.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'financial_literacy',
    order: 3,
  },
];
