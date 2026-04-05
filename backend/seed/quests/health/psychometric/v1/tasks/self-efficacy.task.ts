import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const selfEfficacyTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'self_efficacy',
  title: 'Strengthen Your Exercise Confidence',
  description: 'Assess your belief in your ability to stay active even when life gets tough. Discover whether fatigue, time constraints, or obstacles derail you and learn how to build unstoppable exercise confidence.',
  illustration: 'trophy',
  framework: 'Exercise Self-Efficacy Scale (Marcus et al.)',
  order: 2,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: [],
    ranges: {
      low: [1, 3.5],
      moderate: [3.51, 5.5],
      high: [5.51, 7],
    },
  },
  interpretations: [
    {
      category: 'low',
      range: [1, 3.5],
      label: 'Building Fitness Confidence',
      description: 'Your exercise confidence is ready to grow. Right now obstacles may feel overwhelming—but with small wins, you will build unstoppable belief in your abilities.',
      traits: [
        'Ready to build exercise confidence',
        'Learning to overcome barriers',
        'Developing resilience strategies',
        'Primed for breakthrough moments',
      ],
      recommendations: [
        'Start with very small, achievable exercise goals',
        'Track small wins to build confidence gradually',
        'Remove barriers: lay out workout clothes, schedule exercise',
        'Work with a trainer or coach for accountability and support',
      ],
    },
    {
      category: 'moderate',
      range: [3.51, 5.5],
      label: 'Rising Confidence',
      description: 'Your fitness confidence is building momentum. You overcome most barriers—and with a few more wins, you will feel unstoppable.',
      traits: [
        'Steadily growing confidence',
        'Overcomes most barriers',
        'Building consistent habits',
        'Developing exercise resilience',
      ],
      recommendations: [
        'Build resilience by exercising through minor barriers',
        'Create backup plans for common obstacles',
        'Celebrate your consistency even during difficult weeks',
        'Join exercise communities for motivation and support',
      ],
    },
    {
      category: 'high',
      range: [5.51, 7],
      label: 'Unstoppable Mindset',
      description: 'Obstacles do not stop you—they challenge you. Your rock-solid confidence in your exercise abilities means nothing keeps you from staying active.',
      traits: [
        'Bulletproof exercise confidence',
        'Transforms barriers into challenges',
        'Maintains habits through anything',
        'Master problem-solver',
      ],
      recommendations: [
        'Use your confidence to try new and challenging activities',
        'Mentor others who struggle with exercise consistency',
        'Set ambitious fitness goals that push your limits',
        'Maintain humility and adapt when life circumstances change',
      ],
    },
  ],
};

export const selfEfficacyQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'self_efficacy',
    questionId: 'se_q1',
    text: 'I am confident I can exercise even when I\'m tired.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'fatigue_barrier',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'self_efficacy',
    questionId: 'se_q2',
    text: 'I can stick to my exercise routine even when I\'m busy.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'time_barrier',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'self_efficacy',
    questionId: 'se_q3',
    text: 'I believe I can overcome obstacles that prevent me from exercising.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'obstacle_confidence',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'self_efficacy',
    questionId: 'se_q4',
    text: 'I can make time for physical activity even with a demanding schedule.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'scheduling_confidence',
    order: 4,
  },
];
