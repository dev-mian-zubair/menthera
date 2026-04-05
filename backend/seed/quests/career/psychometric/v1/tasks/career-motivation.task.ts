import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const careerMotivationTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'career_motivation',
  title: 'Ignite Your Career Passion',
  description: 'Uncover what truly drives you at work and discover if your motivation comes from within or external rewards. Learn how to find roles that fuel your intrinsic passion and create lasting career satisfaction.',
  illustration: 'flame',
  framework: 'Self-Determination Theory (Deci & Ryan)',
  order: 2,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: ['cm_q2'],
    ranges: {
      extrinsic: [1, 3.5],
      balanced: [3.51, 5.5],
      intrinsic: [5.51, 7],
    },
  },
  interpretations: [
    {
      category: 'extrinsic',
      range: [1, 3.5],
      label: 'Finding Your Fire',
      description: 'External rewards drive you now—and that is a valid starting point. As you discover what truly excites you about work, your motivation will become deeper and more sustainable.',
      traits: [
        'Ready to discover deeper drivers',
        'Values recognition and achievement',
        'Open to finding meaning in work',
        'Primed for motivation evolution',
      ],
      recommendations: [
        'Reflect on what aspects of your work you genuinely enjoy',
        'Seek projects that align with personal interests',
        'Identify ways to find meaning beyond external validation',
        'Consider career counseling to explore intrinsic motivators',
      ],
    },
    {
      category: 'balanced',
      range: [3.51, 5.5],
      label: 'Balanced Drive',
      description: 'You have found a healthy mix—purpose fuels you while practical rewards matter too. This balanced approach creates sustainable career satisfaction.',
      traits: [
        'Blends purpose with pragmatism',
        'Sustainably motivated',
        'Engaged across different circumstances',
        'Realistic and grounded',
      ],
      recommendations: [
        'Continue nurturing both intrinsic and extrinsic motivators',
        'Seek roles that offer competitive compensation and meaningful impact',
        'Regularly assess if your work balance feels sustainable',
        'Set career goals that address both personal growth and advancement',
      ],
    },
    {
      category: 'intrinsic',
      range: [5.51, 7],
      label: 'Purpose-Powered',
      description: 'You have found your why. Autonomy, mastery, and meaningful impact drive you—this intrinsic fire creates career satisfaction that external rewards alone can never match.',
      traits: [
        'Fueled by autonomy and purpose',
        'Passionate about continuous learning',
        'Driven by meaningful impact',
        'Self-sustaining motivation',
      ],
      recommendations: [
        'Seek roles with high autonomy and creative freedom',
        'Prioritize organizations with missions aligned to your values',
        'Ensure compensation still meets your financial needs',
        'Consider mentoring others to amplify your impact',
      ],
    },
  ],
};

export const careerMotivationQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'career_motivation',
    questionId: 'cm_q1',
    text: 'I am motivated by having control over how I do my work.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'autonomy',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'career_motivation',
    questionId: 'cm_q2',
    text: 'Recognition and external rewards drive my career decisions.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'external_rewards',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'career_motivation',
    questionId: 'cm_q3',
    text: 'I prioritize continuous learning and skill mastery.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'competence',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'career_motivation',
    questionId: 'cm_q4',
    text: 'Making a meaningful impact on others is important to me.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'relatedness',
    order: 4,
  },
];
