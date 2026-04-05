import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const exerciseMotivationTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'exercise_motivation',
  title: 'Fuel Your Fitness Fire',
  description: 'Discover what truly drives you to move your body and whether you exercise from external pressure or genuine joy. Learn how to shift from obligation to inspiration and build a sustainable, lifelong love of fitness.',
  illustration: 'flame',
  framework: 'Behavioral Regulation in Exercise Questionnaire (BREQ-3)',
  order: 1,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: [],
    ranges: {
      externally_driven: [-6, -2],
      mixed: [-1.99, 1.99],
      intrinsically_driven: [2, 6],
    },
  },
  interpretations: [
    {
      category: 'externally_driven',
      range: [-6, -2],
      label: 'Discovering Your Why',
      description: 'You exercise for external reasons right now—and that is a valid starting point. The exciting news: as you find activities you genuinely enjoy, your motivation will become unshakeable.',
      traits: [
        'Ready to discover intrinsic motivation',
        'Starting from external drivers',
        'Has room to find genuine enjoyment',
        'Primed for motivation transformation',
      ],
      recommendations: [
        'Explore activities you genuinely enjoy rather than "should" do',
        'Focus on how exercise makes you feel, not just how you look',
        'Set process goals (e.g., consistency) not just outcome goals',
        'Find exercise buddies who make activity fun and social',
      ],
    },
    {
      category: 'mixed',
      range: [-1.99, 1.99],
      label: 'Growing Your Inner Drive',
      description: 'Your motivation is evolving. You exercise for both internal and external reasons—and the joy-based motivation is growing stronger with each workout.',
      traits: [
        'Blending internal and external drivers',
        'Appreciating health benefits',
        'Finding moments of genuine enjoyment',
        'Building sustainable motivation',
      ],
      recommendations: [
        'Continue building intrinsic motivation by trying new activities',
        'Notice which workouts you genuinely enjoy versus tolerate',
        'Create a workout environment that feels positive and fun',
        'Shift focus from outcomes to the experience of movement',
      ],
    },
    {
      category: 'intrinsically_driven',
      range: [2, 6],
      label: 'Powered by Joy',
      description: 'You have unlocked the secret: movement is its own reward. Your love of exercise comes from within, making your motivation bulletproof and sustainable.',
      traits: [
        'Genuinely loves movement',
        'Values health and well-being deeply',
        'Finds exercise fun and fulfilling',
        'Unshakeable long-term motivation',
      ],
      recommendations: [
        'Continue exploring activities that bring you joy',
        'Share your love of movement with others',
        'Set challenging goals that maintain your interest',
        'Be mindful during low motivation periods and adjust accordingly',
      ],
    },
  ],
};

export const exerciseMotivationQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'exercise_motivation',
    questionId: 'em_q1',
    text: 'I exercise because it\'s fun and enjoyable.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'intrinsic',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'exercise_motivation',
    questionId: 'em_q2',
    text: 'I value the benefits exercise brings to my health and life.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'identified',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'exercise_motivation',
    questionId: 'em_q3',
    text: 'I feel guilty or anxious when I don\'t exercise.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'introjected',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'exercise_motivation',
    questionId: 'em_q4',
    text: 'I exercise mainly because others say I should or for my appearance.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'external',
    order: 4,
  },
];
