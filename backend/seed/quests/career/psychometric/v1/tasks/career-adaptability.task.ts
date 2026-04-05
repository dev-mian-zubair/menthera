import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const careerAdaptabilityTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'career_adaptability',
  title: 'Navigate Career Change with Confidence',
  description: 'Assess how ready you are to embrace career transitions and navigate the evolving world of work. Discover your adaptability strengths and learn how to confidently pivot when opportunities arise.',
  illustration: 'rocket',
  framework: 'Career Adapt-Abilities Scale (Savickas & Porfeli)',
  order: 4,
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
      label: 'Building Your Wings',
      description: 'You prefer stability right now—and that is perfectly valid. As you build confidence through small explorations, your ability to navigate change will grow stronger.',
      traits: [
        'Values career stability',
        'Ready to build transition skills',
        'Beginning career exploration',
        'Growing change confidence',
      ],
      recommendations: [
        'Start small by exploring adjacent roles or skills',
        'Work with a career coach to build transition confidence',
        'Practice informational interviews to learn about new paths',
        'Develop a career development plan with achievable milestones',
      ],
    },
    {
      category: 'moderate',
      range: [3.51, 5.5],
      label: 'Transition Ready',
      description: 'You are building real adaptability skills. Change does not scare you anymore—you see it as an opportunity to grow and evolve your career.',
      traits: [
        'Growing change confidence',
        'Actively exploring opportunities',
        'Building transition toolkit',
        'Balances stability with growth',
      ],
      recommendations: [
        'Continue expanding your professional network across industries',
        'Take on stretch assignments to build versatile skills',
        'Regularly update your resume and LinkedIn profile',
        'Attend industry events to stay aware of emerging opportunities',
      ],
    },
    {
      category: 'high',
      range: [5.51, 7],
      label: 'Career Navigator',
      description: 'You thrive in change. Transitions excite rather than scare you—you actively explore, plan, and take ownership of your evolving career path.',
      traits: [
        'Thrives in transitions',
        'Proactive career architect',
        'Naturally curious and exploratory',
        'Owns career development fully',
      ],
      recommendations: [
        'Leverage your adaptability to explore entrepreneurial ventures',
        'Mentor others who are navigating career transitions',
        'Consider roles that require agility and diverse skill sets',
        'Continue building a diverse portfolio of experiences',
      ],
    },
  ],
};

export const careerAdaptabilityQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'career_adaptability',
    questionId: 'ca_q1',
    text: 'I actively plan for my future career development.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'concern',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'career_adaptability',
    questionId: 'ca_q2',
    text: 'I feel confident navigating career transitions and changes.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'confidence',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'career_adaptability',
    questionId: 'ca_q3',
    text: 'I regularly explore new career opportunities and skills.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'curiosity',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'career_adaptability',
    questionId: 'ca_q4',
    text: 'I take responsibility for my career decisions and outcomes.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'control',
    order: 4,
  },
];
