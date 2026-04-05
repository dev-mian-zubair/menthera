import { QuestDefinition, QuestEntity, QuestType } from '../../../../../src/services/quests/types';

export const financeQuestMeta: Omit<QuestDefinition, 'pk' | 'sk'> = {
  entity: QuestEntity.QUEST,
  questId: 'finance_psychometric',
  version: 1,
  agentId: '1',
  questType: QuestType.PSYCHOMETRIC,
  title: 'Unlock Your Financial DNA',
  description: 'Discover your unique money personality, risk tolerance, and financial decision-making style. Learn how your mindset shapes your wealth and get personalized strategies to build the financial future you deserve.',
  teaser: 'Decode your money mindset and build real wealth',
  illustration: 'chart-line',
  estimatedTimeMinutes: 5,
  isActive: true,
  reportInfo: {
    title: 'Your Financial DNA Revealed',
    shortDescription: 'Your personalized roadmap to financial freedom',
    icon: '💰',
    messageTemplate: 'Your Financial DNA Report is ready! Discover your money mindset and unlock your path to wealth.',
  },
  reportPromptTemplate: `<system_constraints>
You are a professional financial psychologist generating a personalized analysis report.

<output_requirements>
- Total response: 500-700 words
- Use "you" language throughout
- Be empathetic and encouraging
- Make recommendations specific and actionable
- Frame challenges as growth opportunities
- Avoid financial jargon
- Do not repeat the scores verbatim
</output_requirements>

<disclaimer>
Note: This is educational guidance, not personalized financial advice. Recommend consulting a licensed financial advisor for major decisions.
</disclaimer>

<quality_checks>
Before finalizing, verify:
- All four dimensions are addressed
- Recommendations are practical for daily finances
- Tone is encouraging and non-judgmental
- No generic advice - everything is personalized to scores
</quality_checks>
</system_constraints>

<role>
You are a financial psychologist analyzing a user's money personality.
Framework: Risk Tolerance, Money Attitudes, Locus of Control, Financial Behavior
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
2-3 paragraphs integrating all dimensions. Describe their financial decision-making style, key strengths, and growth areas.

## Risk Awareness
1 paragraph on their investment personality and comfort with market volatility based on risk tolerance score.

## Your Patterns
4-6 bullet points identifying key behavioral patterns:
- How they relate to money emotionally (money attitudes)
- Their sense of control over financial outcomes (locus of control)
- Financial planning and execution habits (financial behavior)
- Decision-making tendencies under uncertainty (risk tolerance)
- Notable contradictions or synergies between dimensions

## Your Action Plan
6-8 specific, actionable recommendations tailored to their unique profile:
- Investment strategies for their risk tolerance
- Budgeting approaches for their money attitudes
- Mindset shifts for financial empowerment
- Habit-building for consistent financial behavior
- Emotional regulation around money decisions
</output_structure>`,
};
