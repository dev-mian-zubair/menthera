import { QuestTask, QuestQuestion, QuestEntity } from '../../../../../../src/services/quests/types';

export const healthLocusControlTask: Omit<QuestTask, 'pk' | 'sk'> = {
  entity: QuestEntity.TASK,
  taskId: 'health_locus_control',
  title: 'Take Control of Your Health',
  description: 'Find out if you see your health as determined by your choices or by luck and external factors. Learn how taking ownership of your daily habits empowers you to create vibrant, lasting wellness.',
  illustration: 'star',
  framework: 'Multidimensional Health Locus of Control (Wallston MHLC)',
  order: 3,
  scoringLogic: {
    scale: 'LIKERT_1_7',
    reverseQuestions: ['hlc_q2', 'hlc_q3'],
    ranges: {
      external: [1, 3.5],
      mixed: [3.51, 5.5],
      internal: [5.51, 7],
    },
  },
  interpretations: [
    {
      category: 'external',
      range: [1, 3.5],
      label: 'Claiming Your Health Power',
      description: 'You are ready to discover how much control you actually have over your health. Small daily choices add up—and you are about to harness that power.',
      traits: [
        'Ready to embrace health agency',
        'Learning how choices impact outcomes',
        'Building partnership with healthcare providers',
        'Discovering preventive power',
      ],
      recommendations: [
        'Learn about how daily choices impact health outcomes',
        'Set one small health goal you can control this week',
        'Work with healthcare providers as partners, not authorities',
        'Track how your behaviors affect how you feel physically',
      ],
    },
    {
      category: 'mixed',
      range: [3.51, 5.5],
      label: 'Balanced Health Owner',
      description: 'You hold a wise perspective—taking action where you can while accepting what you cannot control. This balanced view sets you up for sustainable health success.',
      traits: [
        'Realistic about what you can control',
        'Takes meaningful action',
        'Partners effectively with healthcare providers',
        'Maintains healthy perspective',
      ],
      recommendations: [
        'Continue taking responsibility for controllable health factors',
        'Build healthy habits in areas within your control',
        'Maintain regular preventive healthcare',
        'Accept what you cannot control without self-blame',
      ],
    },
    {
      category: 'internal',
      range: [5.51, 7],
      label: 'Health Empowered',
      description: 'You own your health journey. Your strong belief in your ability to shape your health through daily choices drives consistent, proactive self-care.',
      traits: [
        'Powerful sense of health agency',
        'Proactive about wellness',
        'Champions preventive care',
        'Takes ownership of health outcomes',
      ],
      recommendations: [
        'Continue your proactive approach to health',
        'Be realistic about factors beyond your control',
        'Use your agency to maintain consistent healthy habits',
        'Share your health knowledge and motivation with others',
      ],
    },
  ],
};

export const healthLocusControlQuestions: Omit<QuestQuestion, 'pk' | 'sk'>[] = [
  {
    entity: QuestEntity.QUESTION,
    taskId: 'health_locus_control',
    questionId: 'hlc_q1',
    text: 'The main thing that affects my health is what I do for myself.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'internal',
    order: 1,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'health_locus_control',
    questionId: 'hlc_q2',
    text: 'My health is largely a matter of good fortune or luck.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'chance',
    order: 2,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'health_locus_control',
    questionId: 'hlc_q3',
    text: 'Health professionals control my health outcomes more than I do.',
    scale: 'LIKERT_1_7',
    isReverse: true,
    domain: 'powerful_others',
    order: 3,
  },
  {
    entity: QuestEntity.QUESTION,
    taskId: 'health_locus_control',
    questionId: 'hlc_q4',
    text: 'I am in control of my health and fitness through my daily choices.',
    scale: 'LIKERT_1_7',
    isReverse: false,
    domain: 'internal',
    order: 4,
  },
];
