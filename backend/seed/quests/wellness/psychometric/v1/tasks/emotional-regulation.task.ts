import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const emotionalRegulationTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'emotional_regulation',
  title: 'Master Your Emotions',
  description: 'Discover how effectively you manage intense feelings and learn powerful strategies to stay composed under pressure. Find out if you are developing regulation skills, building capacity, or already emotionally resilient.',
  illustration: 'waves',
  framework: 'Emotion Regulation Questionnaire (Gross & John)',
  order: 1,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: ['er_q2'],
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
      label: 'Unlocking Emotional Power',
      description: 'Your emotions run deep—and learning to work with them will unlock tremendous personal power. You are ready to develop skills that transform intensity into wisdom.',
      traits: [
        'Ready to master intense emotions',
        'Learning to express rather than suppress',
        'Discovering emotional patterns',
        'Developing emotional awareness',
      ],
      recommendations: [
        'Practice naming and labeling emotions as they arise',
        'Learn cognitive reappraisal techniques through therapy or apps',
        'Try journaling to process and understand emotional triggers',
        'Consider working with a therapist specializing in DBT or CBT',
      ],
    },
    {
      category: 'moderate',
      range: [3.51, 5.5],
      label: 'Growing Emotional Mastery',
      description: 'You are building real emotional intelligence. Your regulation skills work in familiar territory—and you are ready to expand your capacity to new situations.',
      traits: [
        'Solid emotional awareness',
        'Regulates well in familiar situations',
        'Expanding comfort with intensity',
        'Building a powerful coping toolkit',
      ],
      recommendations: [
        'Expand your emotion regulation toolkit with new techniques',
        'Practice mindfulness meditation to increase emotional awareness',
        'Identify specific triggers and develop targeted strategies',
        'Continue building skills through therapy or self-help resources',
      ],
    },
    {
      category: 'high',
      range: [5.51, 7],
      label: 'Emotional Intelligence Master',
      description: 'You have cultivated remarkable emotional mastery. You experience feelings fully without being overwhelmed—using awareness to navigate even the stormiest emotions.',
      traits: [
        'Deep emotional awareness',
        'Naturally reframes challenging situations',
        'Embraces emotions with acceptance',
        'Stays composed under pressure',
      ],
      recommendations: [
        'Continue refining your emotional regulation practices',
        'Share your strategies with others who might benefit',
        'Maintain regular mindfulness or reflection practices',
        'Be aware of high-stress periods that may challenge your skills',
      ],
    },
  ],
};

export const emotionalRegulationQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'emotional_regulation',
    questionId: 'er_q1',
    text: 'When I want to feel less negative emotion, I change the way I\'m thinking about the situation.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'cognitive_reappraisal',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'emotional_regulation',
    questionId: 'er_q2',
    text: 'I keep my emotions to myself.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'expressive_suppression',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'emotional_regulation',
    questionId: 'er_q3',
    text: 'I accept my emotions without trying to push them away.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'acceptance',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'emotional_regulation',
    questionId: 'er_q4',
    text: 'I am aware of my emotions as they arise.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'awareness',
    order: 4,
  },
];
