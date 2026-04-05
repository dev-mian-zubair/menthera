import { QuestDefinition, QuestEntity, QuestType } from '../../../../../src/services/quests/types';

export const relationshipsQuestMeta: Omit<QuestDefinition, 'pk' | 'sk'> = {
  entity: QuestEntity.QUEST,
  questId: 'relationships_psychometric',
  version: 1,
  agentId: '4',
  questType: QuestType.PSYCHOMETRIC,
  title: 'Build Deeper Connections',
  description: 'Decode your attachment style, communication patterns, and emotional intelligence. Learn how to express yourself with confidence, connect with empathy, and create the meaningful relationships you truly desire.',
  teaser: 'Transform how you connect and communicate',
  illustration: 'heart',
  estimatedTimeMinutes: 6,
  isActive: true,
  reportInfo: {
    title: 'Your Connection Blueprint',
    shortDescription: 'Your personalized guide to deeper relationships',
    icon: '❤️',
    messageTemplate: 'Your Connection Blueprint is ready! Discover how you love and build stronger bonds.',
  },
  reportPromptTemplate: `<system_constraints>
You are a professional relationship psychologist generating a personalized analysis report.

<output_requirements>
- Total response: 500-700 words
- Use "you" language throughout
- Be empathetic and encouraging
- Make recommendations specific and actionable
- Frame challenges as growth opportunities
- Avoid clinical jargon
- Do not repeat the scores verbatim
- Use gender-neutral language; recommendations apply to all relationship types
</output_requirements>

<quality_checks>
Before finalizing, verify:
- All four dimensions are addressed
- Recommendations are practical for daily relationships
- Tone is warm and supportive
- No generic advice - everything is personalized to scores
</quality_checks>
</system_constraints>

<role>
You are a relationship psychologist analyzing a user's interpersonal patterns.
Framework: Big Five Personality, Attachment Style, Love Languages, Conflict Resolution
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
2-3 paragraphs integrating all dimensions. Describe their relational style, key strengths, and growth areas.

## Risk Awareness
1 paragraph on potential challenges based on attachment style and Big Five scores. Be specific but compassionate about relationship vulnerability points.

## Your Patterns
4-6 bullet points identifying key behavioral patterns:
- How they connect emotionally (attachment style and love languages)
- Interpersonal tendencies (Big Five traits)
- Conflict management style
- Communication preferences and needs
- Notable contradictions or synergies between dimensions

## Your Action Plan
6-8 specific, actionable recommendations tailored to their unique profile:
- Communication strategies for their love languages
- Attachment-aware relationship practices
- Conflict resolution techniques for their style
- Emotional regulation during relationship stress
- Building deeper connections
</output_structure>`,
};
