/**
 * Scoring Engine
 * Utilities for interpreting quest scores and generating insights
 */

import { QuestScore, QuestResponse, QuestQuestion, QuestTask } from './types';

// ========================================
// Type Definitions
// ========================================

export interface ScoreInterpretation {
  category: string;
  range: [number, number]; // Raw score range (1-7 for LIKERT_1_7)
  label: string;
  description: string;
  traits?: string[];
  recommendations?: string[];
  [key: string]: any; // Allow task-specific fields (e.g., riskLevel, severity)
}

export interface InterpretedScore {
  taskId: string;
  framework: string;
  rawScore: number;
  normalizedScore: number;
  category: string;
  interpretation?: ScoreInterpretation;
}

export interface InsightPromptData {
  questId: string;
  questVersion: number;
  agentId: string;
  scores: InterpretedScore[];
  responses: Array<{
    questionText: string;
    value: number;
    taskId: string;
  }>;
}

// ========================================
// Interpretation Functions
// ========================================

/**
 * Get interpretation for a single score
 */
export function interpretScore(
  rawScore: number,
  interpretations: ScoreInterpretation[]
): ScoreInterpretation | null {
  return (
    interpretations.find(
      (interp) => rawScore >= interp.range[0] && rawScore <= interp.range[1]
    ) || null
  );
}

/**
 * Get interpretations for all session scores using task definitions
 */
export function interpretSessionScores(
  scores: QuestScore[],
  tasks: QuestTask[]
): InterpretedScore[] {
  const interpretedScores: InterpretedScore[] = [];

  for (const score of scores) {
    const task = tasks.find((t) => t.taskId === score.taskId);
    if (!task) continue;

    // If task has interpretations, use them; otherwise just include raw score
    const interpretation = task.interpretations
      ? interpretScore(score.rawScore, task.interpretations)
      : null;

    interpretedScores.push({
      taskId: score.taskId,
      framework: task.framework,
      rawScore: score.rawScore,
      normalizedScore: score.normalizedScore,
      category: score.category,
      interpretation: interpretation || undefined,
    } as InterpretedScore);
  }

  return interpretedScores;
}

/**
 * Build structured data for LLM insight generation
 */
export function buildInsightPromptData(
  questId: string,
  questVersion: number,
  agentId: string,
  scores: QuestScore[],
  responses: QuestResponse[],
  questions: QuestQuestion[],
  tasks: QuestTask[]
): InsightPromptData {
  const interpretedScores = interpretSessionScores(scores, tasks);

  const enrichedResponses = responses.map((resp) => {
    const question = questions.find((q) => q.questionId === resp.questionId);
    return {
      questionText: question?.text || '',
      value: resp.value,
      taskId: resp.taskId,
    };
  });

  return {
    questId,
    questVersion,
    agentId,
    scores: interpretedScores,
    responses: enrichedResponses,
  };
}

// ========================================
// Prompt Rendering (Simple Template)
// ========================================

/**
 * Simple template variable replacement
 * Supports {{variable}} syntax
 */
export function renderPromptTemplate(template: string, data: any): string {
  let rendered = template;

  // Simple variable replacement
  const variables = template.match(/\{\{(\w+)\}\}/g);
  if (variables) {
    variables.forEach((variable) => {
      const key = variable.replace(/\{\{|\}\}/g, '');
      if (data[key] !== undefined) {
        rendered = rendered.replace(variable, String(data[key]));
      }
    });
  }

  return rendered;
}

/**
 * Format scores for prompt
 */
export function formatScoresForPrompt(scores: InterpretedScore[]): string {
  return scores
    .map(
      (score) => `
### ${score.framework}
- **Task ID**: ${score.taskId}
- **Raw Score**: ${score.rawScore.toFixed(2)} / 7
- **Normalized Score**: ${score.normalizedScore} / 100
- **Category**: ${score.category}${score.interpretation ? ` (${score.interpretation.label})` : ''}${score.interpretation?.description ? `\n- **Description**: ${score.interpretation.description}` : ''}
`
    )
    .join('\n');
}

/**
 * Format responses for prompt
 */
export function formatResponsesForPrompt(
  responses: Array<{ questionText: string; value: number }>
): string {
  return responses
    .map((resp, idx) => `- **Q${idx + 1}**: ${resp.questionText}\n  - **Answer**: ${resp.value} / 7`)
    .join('\n');
}
