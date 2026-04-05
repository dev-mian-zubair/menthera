// Quests API module
import { apiClient } from './client';
import { API_CONFIG, ApiResponse } from './config';
import { logger } from '../utils/logger';

// Quest types
export interface QuestDefinition {
  questId: string;
  version: number;
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  totalQuestions: number;
  tasks: Array<{
    taskId: string;
    framework: string;
    order: number;
    questionCount: number;
  }>;
}

export interface QuestTask {
  taskId: string;
  framework: string;
  order: number;
}

export interface QuestTaskWithQuestions {
  taskId: string;
  title: string;
  description: string;
  framework: string;
  order: number;
  questions: QuestQuestion[];
}

export interface QuestQuestion {
  taskId: string;
  questionId: string;
  text: string;
  scale: 'LIKERT_1_7';
  isReverse: boolean;
  domain?: string;
  order: number;
}

export interface QuestData {
  quest: {
    questId: string;
    version: number;
    title: string;
    description: string;
    estimatedTimeMinutes: number;
    totalQuestions: number;
    tasks: Array<{
      taskId: string;
      framework: string;
      order: number;
      questionCount: number;
    }>;
  };
  session: {
    status: 'not_started' | 'in_progress' | 'completed';
    sessionId: string | null;
    currentTaskId: string | null;
    completedAt: string | null;
  };
}

export interface QuestSessionData {
  session: {
    sessionId: string;
    questId: string;
    questVersion: number;
    status: 'in_progress' | 'completed';
    currentTaskId: string | null;
  };
  tasks: QuestTaskWithQuestions[];
}

// For compatibility with QuestProvider state
export interface QuestSession {
  sessionId: string;
  questId: string;
  questVersion: number;
  status: 'in_progress' | 'completed';
  currentQuestion: {
    taskId: string;
    questionId: string;
    text: string;
    scale: string;
    order: number;
    progressIndex: number;
    totalQuestions: number;
  } | null;
}

export interface QuestScore {
  taskId: string;
  rawScore: number;
  normalizedScore: number;
  category: string;
  computedAt: string;
}

export interface QuestStatusResponse {
  status: 'not_started' | 'in_progress' | 'completed';
  sessionId?: string;
  completedAt?: string;
}

export interface QuestInsight {
  insightType: 'summary' | 'risk_profile' | 'recommendations' | 'report';
  content: string;
  model: string;
  createdAt: string;
}

export interface QuestReportSubsection {
  title: string;
  content: string; // Markdown formatted content
}

export interface QuestReportSection {
  id: string;
  title: string;
  icon: string;
  summary: string; // Brief overview of the section
  subsections: QuestReportSubsection[];
  order: number;
}

export interface QuestReport {
  sessionId: string;
  questId: string;
  questVersion: number;
  completedAt: string | null;
  reportReady: boolean;
  reportData: {
    title: string;
    description: string;
    sections: QuestReportSection[];
    generatedAt: string;
    model: string;
  } | null;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  taskId: string;
  value: number; // 1-7 for LIKERT_1_7
}

export interface SubmitTaskRequest {
  sessionId: string;
  taskId: string;
  answers: Array<{
    questionId: string;
    value: number;
  }>;
}

export interface SubmitAnswerResponse {
  submitted: boolean;
  nextQuestion: QuestQuestion | null;
  completion?: {
    questCompleted: boolean;
    sessionId: string;
    completedAt: string;
    reportGenerating: boolean;
  };
}

export interface SubmitTaskResponse {
  submitted: boolean;
  nextTask: {
    taskId: string;
    title: string;
    questionCount: number;
  } | null;
  completion?: {
    questCompleted: boolean;
    sessionId: string;
    completedAt: string;
    reportGenerating: boolean;
  };
}


/**
 * Quests API - All quest-related API calls
 */
export const questsApi = {
  /**
   * Get quest definition for an agent (includes session status)
   */
  async getQuestDefinition(agentId: string): Promise<ApiResponse<QuestData>> {
    try {
      logger.info(`Fetching quest definition for agent: ${agentId}`);

      const response = await apiClient.get<QuestData>(
        `/quests/${agentId}`,
        {
          skipMock: false,
        }
      );

      if (response.success && response.data?.quest) {
        logger.info(`Quest definition fetched: ${response.data.quest.title}`);
      }

      return response;
    } catch (error) {
      logger.error('Failed to fetch quest definition', error);
      throw error;
    }
  },

  /**
   * Start a new quest session
   */
  async startQuestSession(agentId: string): Promise<ApiResponse<QuestSessionData>> {
    try {
      logger.info(`Starting quest session for agent: ${agentId}`);

      const response = await apiClient.post<QuestSessionData>(
        `/quests/${agentId}/start`,
        {}
      );

      if (response.success && response.data) {
        logger.info(`Quest session started: ${response.data.session.sessionId}`);
      }

      return response;
    } catch (error) {
      logger.error('Failed to start quest session', error);
      throw error;
    }
  },

  /**
   * Submit an answer to a quest question (DEPRECATED - use submitTask)
   */
  async submitAnswer(
    agentId: string,
    data: SubmitAnswerRequest
  ): Promise<ApiResponse<SubmitAnswerResponse>> {
    try {
      logger.debug(`Submitting answer for question: ${data.questionId}`);

      const response = await apiClient.post<SubmitAnswerResponse>(
        `/quests/${agentId}/submit`,
        data
      );

      if (response.success && response.data) {
        if (response.data.completion) {
          logger.info('Quest completed!');
        } else if (response.data.nextQuestion) {
          logger.debug(`Next question: ${response.data.nextQuestion.questionId}`);
        }
      }

      return response;
    } catch (error) {
      logger.error('Failed to submit answer', error);
      throw error;
    }
  },

  /**
   * Submit all answers for a task
   */
  async submitTask(
    agentId: string,
    data: SubmitTaskRequest
  ): Promise<ApiResponse<SubmitTaskResponse>> {
    try {
      logger.debug(`Submitting task: ${data.taskId} with ${data.answers.length} answers`);

      const response = await apiClient.post<SubmitTaskResponse>(
        `/quests/${agentId}/submit`,
        data
      );

      if (response.success && response.data) {
        if (response.data.completion) {
          logger.info('Quest completed!');
        } else if (response.data.nextTask) {
          logger.debug(`Next task: ${response.data.nextTask.taskId}`);
        }
      }

      return response;
    } catch (error) {
      logger.error('Failed to submit task', error);
      throw error;
    }
  },

  /**
   * Get quest report (insights only, no scores)
   */
  async getQuestReport(agentId: string): Promise<ApiResponse<QuestReport>> {
    try {
      logger.info(`Fetching quest report for agent: ${agentId}`);

      const response = await apiClient.get<{ report: QuestReport }>(
        `/quests/${agentId}/report`,
        {
          skipMock: false,
        }
      );

      if (response.success && response.data) {
        logger.info(`Report fetched:`, {
          reportReady: response.data.report.reportReady,
          hasReportData: !!response.data.report.reportData,
        });

        // Unwrap the report from the response
        return {
          success: true,
          data: response.data.report,
        };
      }

      return response as any;
    } catch (error) {
      logger.error('Failed to fetch quest report', error);
      throw error;
    }
  },
};
