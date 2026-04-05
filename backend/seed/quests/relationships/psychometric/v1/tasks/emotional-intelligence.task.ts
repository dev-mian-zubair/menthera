import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const emotionalIntelligenceTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'emotional_intelligence',
  title: 'Elevate Your Emotional Intelligence',
  description: 'Assess your ability to understand yourself and read the emotions of others. Discover how high EQ unlocks deeper connections, stronger relationships, and the power to navigate social situations with grace.',
  illustration: 'brain',
  framework: 'Wong & Law Emotional Intelligence Scale (WLEIS)',
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
      label: 'Awakening EQ',
      description: 'Your emotional intelligence journey is just beginning. As you develop awareness of your own feelings and learn to read others, relationships will deepen in powerful ways.',
      traits: [
        'Ready to develop emotional awareness',
        'Learning to read emotional cues',
        'Discovering emotional patterns',
        'Building regulation skills',
      ],
      recommendations: [
        'Practice naming and labeling your emotions throughout the day',
        'Read books on emotional intelligence like "Emotional Intelligence 2.0"',
        'Work with a therapist to develop emotional awareness',
        'Pay attention to body sensations that signal emotions',
      ],
    },
    {
      category: 'moderate',
      range: [3.51, 5.5],
      label: 'Growing EQ',
      description: 'Your emotional intelligence is developing nicely. You read feelings well in familiar situations—and your skills are expanding into new territory.',
      traits: [
        'Solid emotional awareness',
        'Reads emotions effectively',
        'Building regulation mastery',
        'Using emotions constructively',
      ],
      recommendations: [
        'Continue building emotional vocabulary and awareness',
        'Practice active listening to better understand others',
        'Develop strategies for managing difficult emotions',
        'Seek feedback on how you come across emotionally to others',
      ],
    },
    {
      category: 'high',
      range: [5.51, 7],
      label: 'EQ Master',
      description: 'Your emotional intelligence is a superpower. You understand yourself deeply, read others accurately, and navigate social situations with remarkable grace.',
      traits: [
        'Deep emotional self-awareness',
        'Naturally reads others feelings',
        'Masters emotional regulation',
        'Leverages emotions powerfully',
      ],
      recommendations: [
        'Leverage your EQ to build stronger relationships',
        'Mentor others in developing emotional intelligence',
        'Continue refining your emotional skills in challenging situations',
        'Consider roles that value high emotional intelligence',
      ],
    },
  ],
};

export const emotionalIntelligenceQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'emotional_intelligence',
    questionId: 'ei_q1',
    text: 'I have a good understanding of my own emotions.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'self_emotion_appraisal',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'emotional_intelligence',
    questionId: 'ei_q2',
    text: 'I am sensitive to the feelings and emotions of others.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'others_emotion_appraisal',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'emotional_intelligence',
    questionId: 'ei_q3',
    text: 'I use my emotions to motivate myself to do better.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'use_of_emotion',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'emotional_intelligence',
    questionId: 'ei_q4',
    text: 'I am able to control my temper and handle difficulties rationally.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'regulation_of_emotion',
    order: 4,
  },
];
