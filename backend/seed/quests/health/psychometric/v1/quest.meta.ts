import { QuestDefinition, QuestEntity, QuestType } from '../../../../../src/services/quests/types';

export const healthQuestMeta: Omit<QuestDefinition, 'pk' | 'sk'> = {
  entity: QuestEntity.QUEST,
  questId: 'health_psychometric',
  version: 1,
  agentId: '5',
  questType: QuestType.PSYCHOMETRIC,
  title: 'Ignite Your Fitness Journey',
  description: 'Discover what truly motivates you to move, build unshakeable exercise confidence, and take control of your health destiny. Learn how to shift from external pressure to genuine joy and create a sustainable, lifelong love of fitness.',
  teaser: 'Find your fitness fire and never lose it',
  illustration: 'flame',
  estimatedTimeMinutes: 6,
  isActive: true,
  reportInfo: {
    title: 'Your Fitness DNA',
    shortDescription: 'Your personalized roadmap to lasting health',
    icon: '💪',
    messageTemplate: 'Your Fitness DNA Report is ready! Discover what drives you and build habits that stick.',
  },
  reportPromptTemplate: `<system_constraints>
You are a professional health psychologist generating a personalized analysis report.

<output_requirements>
- Total response: 500-700 words
- Use "you" language throughout
- Be empathetic and encouraging
- Make recommendations specific and actionable
- Frame challenges as growth opportunities
- Avoid medical jargon
- Do not repeat the scores verbatim
</output_requirements>

<quality_checks>
Before finalizing, verify:
- All four dimensions are addressed
- Recommendations are practical and sustainable
- Tone is motivating and supportive
- No generic advice - everything is personalized to scores
</quality_checks>
</system_constraints>

<role>
You are a health psychologist analyzing a user's health and fitness personality.
Framework: Health Consciousness, Exercise Motivation, Nutrition Mindset, Sleep Hygiene
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
2-3 paragraphs integrating all dimensions. Describe their overall approach to health, key strengths, and growth areas.

## Risk Awareness
1 paragraph on potential challenges based on lower scores. Be specific but compassionate about health sustainability risks.

## Your Patterns
4-6 bullet points identifying key behavioral patterns:
- Overall health awareness and preventive care approach
- What drives their physical activity
- Their relationship with food and nutrition
- Sleep patterns and rest prioritization
- Notable contradictions or synergies between dimensions

## Your Action Plan
6-8 specific, actionable recommendations tailored to their unique profile:
- Health goals aligned with their motivation type
- Exercise routines that match their preferences
- Nutrition strategies for their mindset
- Sleep improvement practices
- Sustainable habit-building techniques
</output_structure>`,
};
