/**
 * Quest Drafts Storage
 * Handles local storage of draft answers for in-progress quest tasks
 * Uses SecureStore to persist user answers when they exit mid-task
 */

import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

interface QuestDraft {
  agentId: string;
  taskId: string;
  answers: Record<string, number>; // questionId -> value
  lastUpdated: string;
}

/**
 * Generate storage key for a quest draft
 */
function getDraftKey(userId: string, agentId: string, taskId: string): string {
  return `quest_draft_${userId}_${agentId}_${taskId}`;
}

/**
 * Save draft answers for a task
 * @param userId - Current user ID
 * @param agentId - Agent ID for the quest
 * @param taskId - Task ID within the quest
 * @param answers - Map of questionId -> value
 */
export async function saveQuestDraft(
  userId: string,
  agentId: string,
  taskId: string,
  answers: Map<string, number>
): Promise<void> {
  try {
    const key = getDraftKey(userId, agentId, taskId);
    const draft: QuestDraft = {
      agentId,
      taskId,
      answers: Object.fromEntries(answers),
      lastUpdated: new Date().toISOString(),
    };

    await SecureStore.setItemAsync(key, JSON.stringify(draft));
    logger.debug('[Quest Drafts] Saved draft for task:', taskId);
  } catch (error) {
    logger.error('[Quest Drafts] Failed to save draft:', error);
    // Don't throw - failing to save draft shouldn't break the app
  }
}

/**
 * Load draft answers for a task
 * @param userId - Current user ID
 * @param agentId - Agent ID for the quest
 * @param taskId - Task ID within the quest
 * @returns Map of questionId -> value, or null if no draft exists
 */
export async function loadQuestDraft(
  userId: string,
  agentId: string,
  taskId: string
): Promise<Map<string, number> | null> {
  try {
    const key = getDraftKey(userId, agentId, taskId);
    const json = await SecureStore.getItemAsync(key);

    if (!json) {
      return null;
    }

    const draft: QuestDraft = JSON.parse(json);
    const answersMap = new Map(
      Object.entries(draft.answers).map(([k, v]) => [k, Number(v)])
    );

    logger.debug('[Quest Drafts] Loaded draft for task:', taskId, `(${answersMap.size} answers)`);
    return answersMap;
  } catch (error) {
    logger.error('[Quest Drafts] Failed to load draft:', error);
    return null;
  }
}

/**
 * Clear draft when task is submitted
 * @param userId - Current user ID
 * @param agentId - Agent ID for the quest
 * @param taskId - Task ID within the quest
 */
export async function clearQuestDraft(
  userId: string,
  agentId: string,
  taskId: string
): Promise<void> {
  try {
    const key = getDraftKey(userId, agentId, taskId);
    await SecureStore.deleteItemAsync(key);
    logger.debug('[Quest Drafts] Cleared draft for task:', taskId);
  } catch (error) {
    logger.error('[Quest Drafts] Failed to clear draft:', error);
    // Don't throw - failing to clear draft is not critical
  }
}

/**
 * Clear all drafts for an agent (when quest is completed or reset)
 * @param userId - Current user ID
 * @param agentId - Agent ID for the quest
 */
export async function clearAllQuestDrafts(
  userId: string,
  agentId: string
): Promise<void> {
  try {
    // Note: SecureStore doesn't have a way to list all keys, so we can't
    // iterate and delete. Instead, we'll clear drafts as tasks are submitted.
    // This is a placeholder for future enhancement if needed.
    logger.debug('[Quest Drafts] Clear all drafts requested for agent:', agentId);
  } catch (error) {
    logger.error('[Quest Drafts] Failed to clear all drafts:', error);
  }
}
