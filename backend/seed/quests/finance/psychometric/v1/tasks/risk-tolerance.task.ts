import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const riskToleranceTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'risk_tolerance',
  title: 'Discover Your Risk Profile',
  description: 'Understand how comfortable you are with financial uncertainty and discover the investment strategies that match your personality. Find out if you are a conservative protector, balanced investor, or aggressive growth seeker.',
  illustration: 'balance-scale',
  framework: 'Grable-Lytton Risk Tolerance Scale',
  order: 1,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: [],
    ranges: {
      low: [1, 3],
      moderate: [3.01, 5],
      high: [5.01, 7],
    },
  },
  interpretations: [
    {
      category: 'low',
      range: [1, 3],
      label: 'Steady Builder',
      description: 'You value stability and security—a perfectly valid investment philosophy. Your careful approach protects what you have earned while building wealth gradually.',
      traits: [
        'Values capital protection',
        'Prioritizes predictability',
        'Sleeps well at night',
        'Builds wealth steadily',
      ],
      recommendations: [
        'Focus on bonds, fixed deposits, and money market funds',
        'Build emergency fund with 6-12 months expenses',
        'Consider diversified balanced funds for modest growth',
        'Review inflation impact on conservative portfolios',
      ],
      riskLevel: 'low',
    },
    {
      category: 'moderate',
      range: [3.01, 5],
      label: 'Balanced Strategist',
      description: 'You walk the middle path—accepting some volatility for growth potential while protecting against major losses. This balanced approach serves long-term wealth building well.',
      traits: [
        'Strategic balance of risk and reward',
        'Comfortable with market swings',
        'Long-term growth mindset',
        'Natural diversifier',
      ],
      recommendations: [
        'Diversify across stocks (50-60%) and bonds (40-50%)',
        'Consider index funds and ETFs for broad exposure',
        'Rebalance portfolio annually',
        'Set realistic 7-10% annual return expectations',
      ],
      riskLevel: 'moderate',
    },
    {
      category: 'high',
      range: [5.01, 7],
      label: 'Growth Champion',
      description: 'You embrace volatility as the price of exceptional returns. Market dips do not scare you—they excite you as buying opportunities on your wealth-building journey.',
      traits: [
        'Thrives on growth potential',
        'Sees opportunity in volatility',
        'Long-term vision',
        'Bold financial decisions',
      ],
      recommendations: [
        'Allocate 70-90% to equities for maximum growth',
        'Explore growth stocks, emerging markets, and alternatives',
        'Maintain 3-6 month emergency fund for flexibility',
        'Stay disciplined during market downturns',
      ],
      riskLevel: 'high',
    },
  ],
};

export const riskToleranceQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'risk_tolerance',
    questionId: 'rt_q1',
    text: 'How comfortable are you with taking financial risks?',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'risk_comfort',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'risk_tolerance',
    questionId: 'rt_q2',
    text: 'If your investments dropped 20% in value, would you sell, hold, or buy more?',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'loss_reaction',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'risk_tolerance',
    questionId: 'rt_q3',
    text: 'I am willing to accept higher volatility for potentially higher returns.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'volatility_tolerance',
    order: 3,
  },
];
