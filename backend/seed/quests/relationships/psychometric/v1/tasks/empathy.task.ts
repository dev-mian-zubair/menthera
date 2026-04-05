import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const empathyTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'empathy',
  title: 'Unlock Your Empathy Power',
  description: 'Discover how deeply you connect with the feelings and perspectives of others. Learn how empathy strengthens your relationships and find the balance between compassionate connection and healthy boundaries.',
  illustration: 'users',
  framework: 'Interpersonal Reactivity Index (Davis IRI)',
  order: 4,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: ['emp_q3'],
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
      label: 'Developing Compassion',
      description: 'Your empathy is ready to grow. As you learn to step into others is shoes and feel what they feel, your relationships will transform in beautiful ways.',
      traits: [
        'Learning perspective-taking',
        'Developing emotional responsiveness',
        'Growing beyond logic-only approach',
        'Discovering emotional connection',
      ],
      recommendations: [
        'Practice perspective-taking by imagining yourself in others situations',
        'Ask questions to understand others feelings rather than assuming',
        'Read fiction to experience diverse perspectives',
        'Consider therapy to explore barriers to empathy',
      ],
    },
    {
      category: 'moderate',
      range: [3.51, 5.5],
      label: 'Growing Empathy',
      description: 'Your empathy is blooming. You understand and respond to others is feelings in many situations—and your capacity for connection continues to deepen.',
      traits: [
        'Takes others is perspectives naturally',
        'Shows genuine concern',
        'Developing emotional attunement',
        'Compassionate in many contexts',
      ],
      recommendations: [
        'Continue practicing active listening and validation',
        'Expand empathy to people different from yourself',
        'Notice when you make assumptions about others feelings',
        'Balance empathy with healthy boundaries',
      ],
    },
    {
      category: 'high',
      range: [5.51, 7],
      label: 'Empathy Champion',
      description: 'Your empathy is a gift. You understand others deeply, feel with them genuinely, and create connections that others can only dream of.',
      traits: [
        'Natural perspective-taker',
        'Deep compassion for others',
        'Fully emotionally present',
        'Sees all viewpoints naturally',
      ],
      recommendations: [
        'Set boundaries to prevent empathy burnout or compassion fatigue',
        'Use your empathy to build strong, meaningful relationships',
        'Be mindful not to lose yourself in others emotions',
        'Consider careers that leverage your empathic strengths',
      ],
    },
  ],
};

export const empathyQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'empathy',
    questionId: 'emp_q1',
    text: 'I try to look at everybody\'s side of a disagreement before making a decision.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'perspective_taking',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'empathy',
    questionId: 'emp_q2',
    text: 'I often have tender, concerned feelings for people less fortunate than me.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'empathic_concern',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'empathy',
    questionId: 'emp_q3',
    text: 'I find it difficult to see things from another person\'s point of view.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'perspective_difficulty',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'empathy',
    questionId: 'emp_q4',
    text: 'I am often touched by things that I see happen to others.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'emotional_response',
    order: 4,
  },
];
