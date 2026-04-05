/**
 * QuestProvider
 * Manages agent-specific quest state with task-based submission
 * Loads all questions upfront, saves draft answers locally
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { logger } from '@/lib/utils/logger';
import {
  questsApi,
  QuestData,
  QuestTaskWithQuestions,
  QuestQuestion,
  QuestReport,
  SubmitTaskResponse,
} from '@/lib/api';
import { saveQuestDraft, loadQuestDraft, clearQuestDraft } from '@/lib/storage/quest-drafts';

interface QuestState {
  questData: QuestData | null;
  sessionId: string | null;
  tasks: QuestTaskWithQuestions[];
  currentTaskIndex: number;
  currentQuestionIndex: number;
  taskAnswers: Map<string, Map<string, number>>; // taskId -> (questionId -> value)
  isCompleted: boolean;
  report: QuestReport | null;
}

interface QuestContextType {
  // State
  questState: QuestState;
  isLoading: boolean;
  error: string | null;
  currentAgentId: string | null;

  // Actions
  checkQuestStatus: (agentId: string) => Promise<'not_started' | 'in_progress' | 'completed'>;
  loadQuestPreview: (agentId: string) => Promise<void>;
  startQuest: (agentId: string) => Promise<void>;

  // Question navigation
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (questionIndex: number) => void;

  // Answer management
  saveAnswer: (questionId: string, value: number) => Promise<void>;
  submitTask: (taskId: string) => Promise<{ isCompleted: boolean }>;

  // Task navigation
  getCurrentTask: () => QuestTaskWithQuestions | null;
  getCurrentQuestion: () => QuestQuestion | null;
  isLastQuestionInTask: () => boolean;
  isFirstQuestionInTask: () => boolean;
  getTaskProgress: () => { current: number; total: number };
  getQuestionProgress: () => { current: number; total: number };

  // Existing
  loadReport: (agentId: string) => Promise<void>;
  resetQuest: () => void;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

const initialQuestState: QuestState = {
  questData: null,
  sessionId: null,
  tasks: [],
  currentTaskIndex: 0,
  currentQuestionIndex: 0,
  taskAnswers: new Map(),
  isCompleted: false,
  report: null,
};

export const QuestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const userId = user?.id || '';

  const [questState, setQuestState] = useState<QuestState>(initialQuestState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);

  // Use refs to always have latest values in callbacks
  const questStateRef = useRef(questState);
  const currentAgentIdRef = useRef(currentAgentId);

  // Keep refs in sync
  questStateRef.current = questState;
  currentAgentIdRef.current = currentAgentId;

  /**
   * Check quest status for an agent (lightweight check, no session start)
   * Returns: 'not_started', 'in_progress', or 'completed'
   */
  const checkQuestStatus = useCallback(
    async (agentId: string): Promise<'not_started' | 'in_progress' | 'completed'> => {
      try {
        setIsLoading(true);
        setError(null);
        setCurrentAgentId(agentId);

        logger.debug('[QuestProvider] Checking quest status for agent:', agentId);

        // Fetch quest definition (includes session status)
        const response = await questsApi.getQuestDefinition(agentId);

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch quest data');
        }

        const { quest, session } = response.data;
        const { status, sessionId, currentTaskId } = session;

        logger.debug('[QuestProvider] Quest status:', status, sessionId ? `(session: ${sessionId}, task: ${currentTaskId})` : '');

        // Fetch tasks for preview (needed for intro screen)
        let tasks: QuestTaskWithQuestions[] = [];
        if (status !== 'completed') {
          try {
            const sessionResponse = await questsApi.startQuestSession(agentId);
            if (sessionResponse.success && sessionResponse.data) {
              tasks = sessionResponse.data.tasks;
              logger.debug('[QuestProvider] Loaded tasks for preview:', tasks.length);
            }
          } catch (taskErr) {
            logger.warn('[QuestProvider] Could not load tasks for preview:', taskErr);
            // Continue without tasks - they'll be loaded in startQuest
          }
        }

        // Update state based on status
        if (status === 'completed') {
          setQuestState((prev) => ({
            ...prev,
            questData: response.data,
            sessionId: sessionId || null,
            isCompleted: true,
            tasks: [],
            taskAnswers: new Map(),
            currentTaskIndex: 0,
            currentQuestionIndex: 0,
          }));
        } else if (status === 'in_progress' && sessionId) {
          // Session exists - tasks loaded, will be confirmed by startQuest
          setQuestState((prev) => ({
            ...prev,
            questData: response.data,
            sessionId,
            tasks,
            taskAnswers: new Map(),
            currentTaskIndex: 0,
            currentQuestionIndex: 0,
            isCompleted: false,
          }));
        } else {
          // Not started - tasks loaded for preview
          setQuestState((prev) => ({
            ...prev,
            questData: response.data,
            tasks,
            sessionId: null,
            taskAnswers: new Map(),
            currentTaskIndex: 0,
            currentQuestionIndex: 0,
            isCompleted: false,
          }));
        }

        return status;
      } catch (err) {
        logger.error('[QuestProvider] Error checking status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check quest status');
        return 'not_started';
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  /**
   * Load quest preview (tasks) for intro screen
   * Starts session in background and loads all tasks
   */
  const loadQuestPreview = useCallback(
    async (agentId: string) => {
      try {
        logger.debug('[QuestProvider] Loading quest preview for agent:', agentId);

        // Start session - this returns ALL tasks with ALL questions
        const sessionResponse = await questsApi.startQuestSession(agentId);

        if (!sessionResponse.success || !sessionResponse.data) {
          throw new Error('Failed to load quest preview');
        }

        const { session, tasks } = sessionResponse.data;

        // Check if session has progress (current task is not the first task)
        const isExistingSession = session.currentTaskId !== null && session.currentTaskId !== tasks[0]?.taskId;

        if (session.status === 'in_progress' && isExistingSession) {
          // Existing session - load draft answers
          const currentTask = tasks[0];
          const draftAnswers = await loadQuestDraft(userId, agentId, currentTask.taskId);

          const initialTaskAnswers = new Map();
          if (draftAnswers) {
            initialTaskAnswers.set(currentTask.taskId, draftAnswers);
          }

          setQuestState((prev) => ({
            ...prev,
            sessionId: session.sessionId,
            tasks,
            taskAnswers: initialTaskAnswers,
          }));
        } else {
          // New session - just store tasks for preview, don't commit sessionId yet
          setQuestState((prev) => ({
            ...prev,
            tasks,
            sessionId: null, // Don't store session ID until user clicks "Start Quest"
          }));
        }

        logger.debug('[QuestProvider] Quest preview loaded with', tasks.length, 'tasks');
      } catch (err) {
        logger.error('[QuestProvider] Error loading quest preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quest preview');
        throw err;
      }
    },
    [userId]
  );

  /**
   * Start a new quest for an agent
   * Creates/confirms session - tasks may already be loaded from checkQuestStatus
   */
  const startQuest = useCallback(
    async (agentId: string) => {
      try {
        setIsLoading(true);
        setError(null);
        setCurrentAgentId(agentId);

        logger.debug('[QuestProvider] Starting quest for agent:', agentId);

        // If tasks already loaded (from checkQuestStatus), just create session
        // Otherwise fetch everything
        let tasks = questStateRef.current.tasks;
        let questData = questStateRef.current.questData;

        if (tasks.length === 0 || !questData) {
          // Fetch quest definition first (for metadata)
          const questResponse = await questsApi.getQuestDefinition(agentId);
          if (!questResponse.success || !questResponse.data) {
            throw new Error('Failed to fetch quest definition');
          }
          questData = questResponse.data;
        }

        // Start session - this returns ALL tasks with ALL questions
        const sessionResponse = await questsApi.startQuestSession(agentId);
        if (!sessionResponse.success || !sessionResponse.data) {
          throw new Error('Failed to start quest session');
        }

        const { session, tasks: sessionTasks } = sessionResponse.data;

        // Use tasks from session response (most up-to-date)
        tasks = sessionTasks;

        // Determine which task to start from
        // If session has currentTaskId, resume from that task
        // Otherwise start from first task
        let currentTaskIndex = 0;
        if (session.currentTaskId) {
          const taskIndex = tasks.findIndex(t => t.taskId === session.currentTaskId);
          if (taskIndex !== -1) {
            currentTaskIndex = taskIndex;
            logger.debug('[QuestProvider] Resuming from task:', session.currentTaskId, 'at index:', taskIndex);
          }
        }

        const currentTask = tasks[currentTaskIndex];
        const draftAnswers = await loadQuestDraft(userId, agentId, currentTask.taskId);

        const initialTaskAnswers = new Map();
        if (draftAnswers) {
          initialTaskAnswers.set(currentTask.taskId, draftAnswers);
          logger.debug('[QuestProvider] Loaded draft answers for task:', currentTask.taskId, 'count:', draftAnswers.size);
        }

        setQuestState({
          questData,
          sessionId: session.sessionId, // Now store the session ID
          tasks,
          currentTaskIndex,
          currentQuestionIndex: 0,
          taskAnswers: initialTaskAnswers,
          isCompleted: false,
          report: null,
        });

        logger.debug('[QuestProvider] Quest started with session:', session.sessionId, 'task:', currentTaskIndex + 1, 'of', tasks.length);
      } catch (err) {
        logger.error('[QuestProvider] Error starting quest:', err);
        setError(err instanceof Error ? err.message : 'Failed to start quest');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  /**
   * Save an answer to the current question (local only)
   */
  const saveAnswer = useCallback(
    async (questionId: string, value: number) => {
      const currentTask = questStateRef.current.tasks[questStateRef.current.currentTaskIndex];
      const agentId = currentAgentIdRef.current;

      if (!currentTask || !agentId) {
        logger.error('[QuestProvider] Cannot save answer - no current task or agent');
        return;
      }

      logger.debug('[QuestProvider] Saving answer:', { questionId, value });

      setQuestState((prev) => {
        const newTaskAnswers = new Map(prev.taskAnswers);
        if (!newTaskAnswers.has(currentTask.taskId)) {
          newTaskAnswers.set(currentTask.taskId, new Map());
        }
        newTaskAnswers.get(currentTask.taskId)!.set(questionId, value);

        return { ...prev, taskAnswers: newTaskAnswers };
      });

      // Persist to local storage
      const taskAnswersMap = new Map(questStateRef.current.taskAnswers.get(currentTask.taskId) || new Map());
      taskAnswersMap.set(questionId, value);
      await saveQuestDraft(userId, agentId, currentTask.taskId, taskAnswersMap);
    },
    [userId]
  );

  /**
   * Submit all answers for a task
   * Returns: { isCompleted: boolean } - true if quest is complete, false if more tasks remain
   */
  const submitTask = useCallback(
    async (taskId: string): Promise<{ isCompleted: boolean }> => {
      const agentId = currentAgentIdRef.current;
      const taskAnswersMap = questStateRef.current.taskAnswers.get(taskId);
      const sessionId = questStateRef.current.sessionId;

      if (!agentId || !taskAnswersMap || !sessionId) {
        logger.error('[QuestProvider] Missing required data for task submission');
        throw new Error('No active quest session or answers');
      }

      try {
        setIsLoading(true);
        setError(null);

        logger.debug('[QuestProvider] Submitting task:', taskId);

        // Convert Map to array
        const answers = Array.from(taskAnswersMap.entries()).map(([questionId, value]) => ({
          questionId,
          value,
        }));

        const response = await questsApi.submitTask(agentId, {
          sessionId,
          taskId,
          answers,
        });

        if (!response.success || !response.data) {
          throw new Error('Failed to submit task');
        }

        const result: SubmitTaskResponse = response.data;

        // Clear local draft
        await clearQuestDraft(userId, agentId, taskId);

        // Check if quest is completed
        if (result.completion?.questCompleted) {
          logger.debug('[QuestProvider] ✓ Quest completed!', {
            sessionId,
            completedAt: result.completion.completedAt,
          });
          setQuestState((prev) => ({
            ...prev,
            isCompleted: true,
            sessionId: result.completion!.sessionId,
          }));
          return { isCompleted: true };
        } else if (result.nextTask) {
          // Move to next task
          logger.debug('[QuestProvider] Moving to next task:', result.nextTask.taskId);

          const nextTaskIndex = questStateRef.current.currentTaskIndex + 1;
          const nextTask = questStateRef.current.tasks[nextTaskIndex];

          if (!nextTask) {
            logger.error('[QuestProvider] No task found at index:', nextTaskIndex);
            throw new Error('Invalid task index - quest may be corrupted');
          }

          // Load draft for next task if exists
          const draftAnswers = await loadQuestDraft(userId, agentId, nextTask.taskId);

          setQuestState((prev) => {
            const newTaskAnswers = new Map(prev.taskAnswers);
            if (draftAnswers) {
              newTaskAnswers.set(nextTask.taskId, draftAnswers);
            }
            return {
              ...prev,
              currentTaskIndex: nextTaskIndex,
              currentQuestionIndex: 0,
              taskAnswers: newTaskAnswers,
            };
          });
          return { isCompleted: false };
        } else {
          logger.warn('[QuestProvider] Task submitted but no nextTask or completion in response');
          return { isCompleted: false };
        }
      } catch (err) {
        logger.error('[QuestProvider] Error submitting task:', err);
        setError(err instanceof Error ? err.message : 'Failed to submit task');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  /**
   * Navigate to next question
   */
  const nextQuestion = useCallback(() => {
    const currentTask = questStateRef.current.tasks[questStateRef.current.currentTaskIndex];
    if (questStateRef.current.currentQuestionIndex < currentTask.questions.length - 1) {
      setQuestState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    }
  }, []);

  /**
   * Navigate to previous question
   */
  const previousQuestion = useCallback(() => {
    if (questStateRef.current.currentQuestionIndex > 0) {
      setQuestState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  }, []);

  /**
   * Jump to a specific question by index
   */
  const goToQuestion = useCallback((questionIndex: number) => {
    const currentTask = questStateRef.current.tasks[questStateRef.current.currentTaskIndex];
    if (questionIndex >= 0 && questionIndex < currentTask.questions.length) {
      setQuestState((prev) => ({
        ...prev,
        currentQuestionIndex: questionIndex,
      }));
    }
  }, []);

  /**
   * Get current task
   */
  const getCurrentTask = useCallback((): QuestTaskWithQuestions | null => {
    if (questStateRef.current.tasks.length === 0) return null;
    return questStateRef.current.tasks[questStateRef.current.currentTaskIndex];
  }, []);

  /**
   * Get current question
   */
  const getCurrentQuestion = useCallback((): QuestQuestion | null => {
    const task = getCurrentTask();
    if (!task || !task.questions || task.questions.length === 0) return null;
    return task.questions[questStateRef.current.currentQuestionIndex] || null;
  }, [getCurrentTask]);

  /**
   * Check if current question is last in task
   */
  const isLastQuestionInTask = useCallback((): boolean => {
    const task = getCurrentTask();
    if (!task || !task.questions || task.questions.length === 0) return false;
    return questStateRef.current.currentQuestionIndex === task.questions.length - 1;
  }, [getCurrentTask]);

  /**
   * Check if current question is first in task
   */
  const isFirstQuestionInTask = useCallback((): boolean => {
    return questStateRef.current.currentQuestionIndex === 0;
  }, []);

  /**
   * Get task progress
   */
  const getTaskProgress = useCallback((): { current: number; total: number } => {
    return {
      current: questStateRef.current.currentTaskIndex + 1,
      total: questStateRef.current.tasks.length,
    };
  }, []);

  /**
   * Get question progress within current task
   */
  const getQuestionProgress = useCallback((): { current: number; total: number } => {
    const task = getCurrentTask();
    if (!task || !task.questions || task.questions.length === 0) return { current: 0, total: 0 };
    return {
      current: questStateRef.current.currentQuestionIndex + 1,
      total: task.questions.length,
    };
  }, [getCurrentTask]);

  /**
   * Load quest report (scores and insights)
   */
  const loadReport = useCallback(
    async (agentId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        logger.debug('[QuestProvider] Loading report for agent:', agentId);

        const response = await questsApi.getQuestReport(agentId);

        if (!response.success || !response.data) {
          throw new Error('Failed to load quest report');
        }

        setQuestState((prev) => ({
          ...prev,
          report: response.data,
          isCompleted: true,
        }));

        logger.debug('[QuestProvider] Report loaded');
      } catch (err) {
        logger.error('[QuestProvider] Error loading report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Reset quest state
   */
  const resetQuest = useCallback(() => {
    setQuestState(initialQuestState);
    setCurrentAgentId(null);
    setError(null);
  }, []);

  const value: QuestContextType = {
    questState,
    isLoading,
    error,
    currentAgentId,
    checkQuestStatus,
    loadQuestPreview,
    startQuest,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    saveAnswer,
    submitTask,
    getCurrentTask,
    getCurrentQuestion,
    isLastQuestionInTask,
    isFirstQuestionInTask,
    getTaskProgress,
    getQuestionProgress,
    loadReport,
    resetQuest,
  };

  return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>;
};

/**
 * Hook to use quest context
 */
export const useQuest = (): QuestContextType => {
  const context = useContext(QuestContext);
  if (!context) {
    throw new Error('useQuest must be used within a QuestProvider');
  }
  return context;
};
