import { QuestDefinition, QuestEntity, QuestType } from '../../../../../src/services/quests/types';

export const careerQuestMeta: Omit<QuestDefinition, 'pk' | 'sk'> = {
  entity: QuestEntity.QUEST,
  questId: 'career_psychometric',
  version: 1,
  agentId: '2',
  questType: QuestType.PSYCHOMETRIC,
  title: 'Find Your Career Sweet Spot',
  description: 'Uncover your natural work personality, career motivations, and growth mindset. Discover the careers where you will thrive and learn how to navigate change with confidence in today\'s dynamic job market.',
  teaser: 'Match your talents to careers you\'ll love',
  illustration: 'compass',
  estimatedTimeMinutes: 6,
  isActive: true,
  reportInfo: {
    title: 'Your Career Blueprint',
    shortDescription: 'Your personalized guide to professional success',
    icon: '🎯',
    messageTemplate: 'Your Career Blueprint is ready! Discover your strengths and unlock your dream career path.',
  },
  reportPromptTemplate: `<system_constraints>
You are a professional career psychologist generating a personalized analysis report.

<output_requirements>
- Total response: 500-700 words
- Use "you" language throughout
- Be empathetic and encouraging
- Make recommendations specific and actionable
- Frame challenges as growth opportunities
- Avoid corporate jargon
- Do not repeat the scores verbatim
</output_requirements>

<quality_checks>
Before finalizing, verify:
- All four dimensions are addressed
- Recommendations are practical for their career stage
- Tone is motivating and realistic
- No generic advice - everything is personalized to scores
</quality_checks>
</system_constraints>

<role>
You are a career psychologist analyzing a user's professional personality.
Framework: Work Personality, Career Motivation, Career Adaptability, Growth Mindset
</role>

<context>
## User Scores
{{scores}}

## User Responses
{{responses}}
</context>

<output_structure>
Generate a report with these exact sections:

## Your Profile Summary
2-3 paragraphs integrating all dimensions. Describe their professional style, key strengths, and development areas.

## Risk Awareness
1 paragraph on their comfort with career transitions and professional uncertainty based on adaptability and growth mindset scores.

## Your Patterns
4-6 bullet points identifying key behavioral patterns:
- Natural work style and environment preferences
- What drives them professionally
- How they handle change and transitions
- Beliefs about learning and growth
- Notable contradictions or synergies between dimensions

## Your Action Plan
6-8 specific, actionable recommendations tailored to their unique profile:
- Career paths aligned with their work personality
- Strategies to leverage their adaptability
- Growth mindset practices for development
- Networking approaches for their personality
- Professional development priorities
</output_structure>`,
};
