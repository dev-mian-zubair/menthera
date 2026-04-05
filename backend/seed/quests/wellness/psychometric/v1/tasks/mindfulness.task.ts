import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const mindfulnessTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'mindfulness',
  title: 'Awaken Your Present Moment',
  description: 'Find out how connected you are to the here and now versus living on autopilot. Discover practices to cultivate mindful awareness and experience life more fully, one moment at a time.',
  illustration: 'sunrise',
  framework: 'Mindful Attention Awareness Scale (Brown & Ryan)',
  order: 3,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: ['mf_q1', 'mf_q2'],
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
      label: 'Awakening Awareness',
      description: 'You are at the beginning of your mindfulness journey with tremendous room to grow. Right now, autopilot mode may dominate your days—but that is about to change.',
      traits: [
        'Ready to break free from autopilot',
        'Untapped potential for presence',
        'Mind naturally active and curious',
        'Opportunity to discover inner stillness',
      ],
      recommendations: [
        'Start with short 5-minute mindfulness meditations daily',
        'Use apps like Headspace or Calm for guided practice',
        'Practice single-tasking: focus on one activity at a time',
        'Try mindful eating: pay full attention to one meal per day',
      ],
    },
    {
      category: 'moderate',
      range: [3.51, 5.5],
      label: 'Growing Presence',
      description: 'You have planted the seeds of mindfulness and they are starting to bloom. Your awareness muscle is strengthening—you catch yourself wandering and gently return.',
      traits: [
        'Building present-moment awareness',
        'Catching mind wandering more often',
        'Developing attention regulation',
        'Naturally mindful in key moments',
      ],
      recommendations: [
        'Expand mindfulness practice to 10-15 minutes daily',
        'Apply mindfulness to routine activities like walking or showering',
        'Practice body scan meditation to enhance sensory awareness',
        'Join a mindfulness group or class for structured practice',
      ],
    },
    {
      category: 'high',
      range: [5.51, 7],
      label: 'Mindful Master',
      description: 'You have cultivated a powerful ability to live in the present moment. Your awareness flows naturally—you experience life fully rather than watching it pass by.',
      traits: [
        'Strong present-moment awareness',
        'Deeply attuned to sensations and feelings',
        'Naturally notices and redirects wandering thoughts',
        'Fully engaged with each moment',
      ],
      recommendations: [
        'Deepen practice with advanced techniques like loving-kindness meditation',
        'Consider teaching or mentoring others in mindfulness',
        'Maintain daily practice to sustain benefits',
        'Explore mindfulness in challenging situations for continued growth',
      ],
    },
  ],
};

export const mindfulnessQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'mindfulness',
    questionId: 'mf_q1',
    text: 'I find it difficult to stay focused on what\'s happening in the present.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'present_focus',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'mindfulness',
    questionId: 'mf_q2',
    text: 'I rush through activities without being really attentive to them.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'automatic_pilot',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'mindfulness',
    questionId: 'mf_q3',
    text: 'I pay attention to sensations and feelings in the moment.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'sensory_awareness',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'mindfulness',
    questionId: 'mf_q4',
    text: 'I notice when my mind wanders and bring it back to the present.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'attention_regulation',
    order: 4,
  },
];
