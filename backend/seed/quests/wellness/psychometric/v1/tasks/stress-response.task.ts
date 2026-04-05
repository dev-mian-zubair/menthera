import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const stressResponseTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'stress_response',
  title: 'Conquer Your Stress',
  description: 'Assess how you currently handle life challenges and discover whether you feel in control or overwhelmed. Learn proven techniques to transform stress from a burden into a manageable part of your thriving life.',
  illustration: 'shield',
  framework: 'Perceived Stress Scale (Cohen)',
  order: 2,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: ['sr_q3', 'sr_q4'],
    ranges: {
      high_stress: [1, 3.5],
      moderate: [3.51, 5.5],
      low_stress: [5.51, 7],
    },
  },
  interpretations: [
    {
      category: 'high_stress',
      range: [1, 3.5],
      label: 'Ready to Reclaim Calm',
      description: 'Life feels intense right now—and that is okay. Recognizing stress is the first step to transforming it. You are ready to build powerful calm-creating skills.',
      traits: [
        'Aware of overwhelm and ready to address it',
        'Building sense of control',
        'Learning to manage competing demands',
        'Primed for stress-relief breakthroughs',
      ],
      recommendations: [
        'Seek support from a mental health professional or counselor',
        'Practice daily stress-reduction techniques like deep breathing',
        'Identify and reduce stressors where possible',
        'Build a support network and ask for help when needed',
      ],
    },
    {
      category: 'moderate',
      range: [3.51, 5.5],
      label: 'Finding Your Balance',
      description: 'You are navigating life is pressures with growing skill. Your coping toolbox is solid—and with a few more techniques, you will feel even more in control.',
      traits: [
        'Managing typical stress effectively',
        'Growing sense of control',
        'Reliable coping skills in place',
        'Ready to level up resilience',
      ],
      recommendations: [
        'Develop a regular self-care routine to prevent stress buildup',
        'Learn additional stress management techniques',
        'Practice setting boundaries to protect your well-being',
        'Monitor stress levels and seek support proactively',
      ],
    },
    {
      category: 'low_stress',
      range: [5.51, 7],
      label: 'Stress-Proof and Thriving',
      description: 'You have mastered the art of staying calm under pressure. Life is challenges feel manageable, and you navigate them with confidence and grace.',
      traits: [
        'Strong sense of control',
        'Confident handling challenges',
        'Proven stress coping strategies',
        'Naturally maintains perspective',
      ],
      recommendations: [
        'Continue maintaining healthy stress management practices',
        'Share your coping strategies with others',
        'Be prepared for unexpected stressors that may arise',
        'Regularly check in with yourself to maintain balance',
      ],
    },
  ],
};

export const stressResponseQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'stress_response',
    questionId: 'sr_q1',
    text: 'In the last month, how often have you felt confident about handling personal problems?',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'coping_confidence',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'stress_response',
    questionId: 'sr_q2',
    text: 'How often have you felt things were going your way?',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'perceived_control',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'stress_response',
    questionId: 'sr_q3',
    text: 'How often have you felt difficulties were piling up so high that you couldn\'t overcome them?',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'stress_accumulation',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'stress_response',
    questionId: 'sr_q4',
    text: 'How often have you felt you were unable to control important things in your life?',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'helplessness',
    order: 4,
  },
];
