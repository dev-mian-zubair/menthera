// API Layer - Main exports
// This file exports all API modules for easy import throughout the app

export { agentsApi } from './agents';
export { conversationsApi } from './conversations';
export { callsApi } from './calls';
export { userApi } from './user';
export { questsApi } from './quests';
export { engagementApi } from './engagement';
export { apiClient } from './client';
export { API_CONFIG, isApiSuccess, isApiError } from './config';

// Re-export types for convenience
export type {
  ApiResponse,
  ApiError,
  PaginationParams,
} from './config';

export type {
  UserUsage,
  ApiKeyInfo,
} from './user';

export type {
  CallSession,
  CallRequest,
} from './calls';

export type {
  QuestDefinition,
  QuestData,
  QuestSession,
  QuestSessionData,
  QuestQuestion,
  QuestTask,
  QuestTaskWithQuestions,
  QuestScore,
  QuestInsight,
  QuestReport,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SubmitTaskRequest,
  SubmitTaskResponse,
} from './quests';

export type {
  ActivityType,
  RecentActivity,
  RecentActivityResponse,
  StreakData,
  StreakResponse,
  TrackActivityRequest,
  TrackActivityResponse,
  ActivitySummary,
  AchievementCategory,
  AchievementProgress,
  AchievementsResponse,
  NewlyUnlockedAchievement,
  CheckAchievementsResponse,
  Milestone,
  MilestoneResponse,
  UserStats,
} from './engagement';