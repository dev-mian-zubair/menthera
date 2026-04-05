import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const communicationStyleTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'communication_style',
  title: 'Speak Your Truth with Confidence',
  description: 'Find out if you are passive, balanced, or assertive in expressing your needs and boundaries. Learn how to communicate clearly, set healthy limits, and be heard without guilt or aggression.',
  illustration: 'target',
  framework: 'Rathus Assertiveness Schedule (Simplified)',
  order: 3,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: ['cs_q2', 'cs_q4'],
    ranges: {
      passive: [1, 3.5],
      balanced: [3.51, 5.5],
      assertive: [5.51, 7],
    },
  },
  interpretations: [
    {
      category: 'passive',
      range: [1, 3.5],
      label: 'Finding Your Voice',
      description: 'Your voice is waiting to be heard. As you learn to express your needs confidently, relationships will transform—and you will feel more respected and understood.',
      traits: [
        'Ready to develop expression skills',
        'Learning to set boundaries',
        'Discovering self-advocacy',
        'Building communication confidence',
      ],
      recommendations: [
        'Practice assertive communication scripts in low-stakes situations',
        'Start saying "no" to small requests to build confidence',
        'Work with a therapist on assertiveness training',
        'Recognize that your needs and opinions are valid and important',
      ],
    },
    {
      category: 'balanced',
      range: [3.51, 5.5],
      label: 'Growing Confidence',
      description: 'Your assertiveness is building. You speak up in familiar situations—and with practice, you will handle even the toughest conversations with grace.',
      traits: [
        'Assertive in many situations',
        'Growing communication confidence',
        'Building difficult conversation skills',
        'Strengthening boundaries',
      ],
      recommendations: [
        'Continue practicing assertive communication techniques',
        'Prepare for difficult conversations in advance',
        'Learn to distinguish between assertive and aggressive communication',
        'Practice expressing needs without guilt or apology',
      ],
    },
    {
      category: 'assertive',
      range: [5.51, 7],
      label: 'Confident Communicator',
      description: 'You speak your truth with clarity and respect. Your ability to express needs and set boundaries creates healthier, more honest relationships.',
      traits: [
        'Expresses needs with clarity',
        'Sets healthy boundaries',
        'Navigates conflict constructively',
        'Communicates with confidence',
      ],
      recommendations: [
        'Continue modeling assertive communication for others',
        'Be mindful of situations where assertiveness could become aggression',
        'Help others develop their assertiveness skills',
        'Maintain balance between assertiveness and empathy',
      ],
    },
  ],
};

export const communicationStyleQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'communication_style',
    questionId: 'cs_q1',
    text: 'I find it easy to express my opinions, even when others disagree.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'direct_communication',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'communication_style',
    questionId: 'cs_q2',
    text: 'I struggle to say "no" when I\'m uncomfortable with a request.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'boundary_setting',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'communication_style',
    questionId: 'cs_q3',
    text: 'I can ask for what I need without feeling guilty or anxious.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'needs_expression',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'communication_style',
    questionId: 'cs_q4',
    text: 'I avoid confrontation even when something bothers me.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'conflict_avoidance',
    order: 4,
  },
];
