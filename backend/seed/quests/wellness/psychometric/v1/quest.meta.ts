import { QuestDefinition, QuestEntity, QuestType } from '../../../../../src/services/quests/types';

export const wellnessQuestMeta: Omit<QuestDefinition, 'pk' | 'sk'> = {
  entity: QuestEntity.QUEST,
  questId: 'wellness_psychometric',
  version: 1,
  agentId: '3',
  questType: QuestType.PSYCHOMETRIC,
  title: 'Master Your Inner Peace',
  description: 'Discover how you manage emotions, respond to stress, and build resilience. Learn powerful strategies to stay calm under pressure, practice mindfulness, and bounce back stronger from life\'s challenges.',
  teaser: 'Build resilience and conquer stress with ease',
  illustration: 'waves',
  estimatedTimeMinutes: 6,
  isActive: true,
  reportInfo: {
    title: 'Your Inner Peace Profile',
    shortDescription: 'Your personalized guide to emotional mastery',
    icon: '🧘',
    messageTemplate: 'Your Inner Peace Profile is ready! Discover your emotional patterns and build unshakeable calm.',
  },
  reportPromptTemplate: `<system_constraints>
You are a professional wellness psychologist generating a personalized analysis report.

<output_requirements>
- Total response: 500-700 words
- Use "you" language throughout
- Be empathetic and encouraging
- Make recommendations specific and actionable
- Frame challenges as growth opportunities
- Avoid clinical jargon
- Do not repeat the scores verbatim
</output_requirements>

<quality_checks>
Before finalizing, verify:
- All four dimensions are addressed
- Recommendations are practical for daily life
- Tone is warm and supportive
- No generic advice - everything is personalized to scores
</quality_checks>
</system_constraints>

<role>
You are a wellness psychologist analyzing a user's emotional wellbeing profile.
Framework: Mindfulness Practice, Stress Management, Work-Life Balance, Self-Care Commitment
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
2-3 paragraphs integrating all dimensions. Describe their overall approach to wellness, key strengths, and growth areas.

## Risk Awareness
1 paragraph on potential challenges based on lower scores. Be specific but compassionate about burnout risk or emotional exhaustion.

## Your Patterns
4-6 bullet points identifying key behavioral patterns:
- Present-moment awareness and mindfulness capacity
- How they cope with stress and pressure
- Ability to set boundaries between work and personal life
- Prioritization of personal needs and recovery
- Notable contradictions or synergies between dimensions

## Your Action Plan
6-8 specific, actionable recommendations tailored to their unique profile:
- Mindfulness practices suited to their level
- Stress reduction techniques for their coping style
- Boundary-setting for work-life balance
- Self-care routines that fit their lifestyle
- Recovery practices to prevent burnout
</output_structure>`,
};
