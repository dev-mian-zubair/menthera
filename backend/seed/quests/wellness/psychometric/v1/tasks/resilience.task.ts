import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const resilienceTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'resilience',
  title: 'Build Unbreakable Resilience',
  description: 'Measure how quickly you bounce back from setbacks and discover your inner strength. Learn how to transform adversity into growth opportunities and develop the resilience to thrive through any challenge.',
  illustration: 'mountain',
  framework: 'Brief Resilience Scale (Smith et al.)',
  order: 4,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: ['res_q2', 'res_q4'],
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
      label: 'Building Your Foundation',
      description: 'Your resilience muscles are ready to grow stronger. Right now, setbacks may feel heavy—but you have the capacity to develop powerful bounce-back abilities.',
      traits: [
        'Ready to build recovery skills',
        'Learning to process challenges',
        'Developing adaptive strategies',
        'Growing through adversity',
      ],
      recommendations: [
        'Build a support network of friends, family, or support groups',
        'Practice self-compassion and avoid self-blame during difficulties',
        'Work with a therapist to develop coping strategies',
        'Start small: overcome manageable challenges to build confidence',
      ],
    },
    {
      category: 'moderate',
      range: [3.51, 5.5],
      label: 'Rising Stronger',
      description: 'You are developing real resilience. When life knocks you down, you get back up—it may take a moment, but you find your footing again.',
      traits: [
        'Growing bounce-back ability',
        'Recovers with support and time',
        'Adapting to challenges with increasing ease',
        'Building a reliable coping toolkit',
      ],
      recommendations: [
        'Continue strengthening your support network',
        'Practice stress management techniques regularly',
        'Reflect on past challenges you have overcome',
        'Develop a growth mindset about adversity',
      ],
    },
    {
      category: 'high',
      range: [5.51, 7],
      label: 'Resilience Champion',
      description: 'You bounce back like a spring. Adversity is temporary, and you know it—you process, adapt, and move forward with remarkable speed and grace.',
      traits: [
        'Rapid recovery from setbacks',
        'Thrives through change',
        'Maintains perspective during storms',
        'Transforms challenges into growth',
      ],
      recommendations: [
        'Continue nurturing the practices that support your resilience',
        'Share your resilience strategies with others',
        'Be prepared for major life stressors that may still challenge you',
        'Maintain self-care practices to sustain resilience over time',
      ],
    },
  ],
};

export const resilienceQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'resilience',
    questionId: 'res_q1',
    text: 'I tend to bounce back quickly after hard times.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'bounce_back',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'resilience',
    questionId: 'res_q2',
    text: 'It is hard for me to snap back when something bad happens.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'recovery_difficulty',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'resilience',
    questionId: 'res_q3',
    text: 'I usually come through difficult times with little trouble.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'adaptation',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'resilience',
    questionId: 'res_q4',
    text: 'It takes me a long time to recover from stressful events.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'recovery_time',
    order: 4,
  },
];
