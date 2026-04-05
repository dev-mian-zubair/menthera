/**
 * Quest system utilities
 * Scoring, normalization, and key generation helpers
 */

import { ScaleType, InsightType } from './types';

// ========================================
// PK / SK HELPER UTILITIES (CRITICAL)
// ========================================

/**
 * Single source of truth for all DynamoDB key construction
 * NEVER hardcode keys in services - always use these helpers
 */
export const QuestKeys = {
  // Quest Definitions Table
  questPK: (questId: string, version: number): string => {
    return `QUEST#${questId}#v${version}`;
  },

  questMetadataSK: (): string => {
    return 'METADATA';
  },

  taskSK: (taskId: string): string => {
    return `TASK#${taskId}`;
  },

  questionSK: (taskId: string, questionId: string): string => {
    return `QUESTION#${taskId}#${questionId}`;
  },

  // Quest Sessions Table
  userPK: (userId: string): string => {
    return `USER#${userId}`;
  },

  sessionSK: (agentId: string, sessionId: string): string => {
    return `AGENT#${agentId}#SESSION#${sessionId}`;
  },

  responseSK: (
    agentId: string,
    sessionId: string,
    taskId: string,
    questionId: string
  ): string => {
    return `AGENT#${agentId}#SESSION#${sessionId}#Q#${taskId}#${questionId}`;
  },

  scoreSK: (agentId: string, sessionId: string, taskId: string): string => {
    return `AGENT#${agentId}#SESSION#${sessionId}#SCORE#${taskId}`;
  },

  insightSK: (agentId: string, sessionId: string, insightType: InsightType): string => {
    return `AGENT#${agentId}#SESSION#${sessionId}#INSIGHT#${insightType}`;
  },

  // Prefix helpers for queries
  sessionPrefix: (agentId: string, sessionId: string): string => {
    return `AGENT#${agentId}#SESSION#${sessionId}`;
  },

  agentSessionsPrefix: (agentId: string): string => {
    return `AGENT#${agentId}#SESSION#`;
  },
};

// ========================================
// SCORING UTILITIES
// ========================================

/**
 * Scoring configuration for different scales
 */
export const SCALE_CONFIG = {
  LIKERT_1_7: {
    min: 1,
    max: 7,
    midpoint: 4,
  },
} as const;

/**
 * Reverse a Likert scale score (1 becomes 7, 7 becomes 1, etc.)
 * Used for negatively-worded questions
 */
export function reverseScore(value: number, scale: ScaleType = 'LIKERT_1_7'): number {
  const config = SCALE_CONFIG[scale];
  return config.max - value + config.min;
}

/**
 * Normalize a score to 0-100 scale
 */
export function normalizeScore(rawScore: number, scale: ScaleType = 'LIKERT_1_7'): number {
  const config = SCALE_CONFIG[scale];
  return Math.round(((rawScore - config.min) / (config.max - config.min)) * 100);
}

/**
 * Categorize a score based on ranges
 * Example ranges: { low: [1, 2.5], medium: [2.5, 5], high: [5, 7] }
 */
export function categorizeScore(
  score: number,
  ranges: Record<string, [number, number]>
): string {
  for (const [category, [min, max]] of Object.entries(ranges)) {
    if (score >= min && score <= max) {
      return category;
    }
  }
  return 'unknown';
}

/**
 * Calculate average score from an array of values
 */
export function calculateAverageScore(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Apply reverse scoring to a set of responses based on question configuration
 */
export function applyReverseScoringToResponses(
  responses: Array<{ questionId: string; value: number; isReverse: boolean }>,
  scale: ScaleType = 'LIKERT_1_7'
): Array<{ questionId: string; adjustedValue: number }> {
  return responses.map((response) => ({
    questionId: response.questionId,
    adjustedValue: response.isReverse
      ? reverseScore(response.value, scale)
      : response.value,
  }));
}
