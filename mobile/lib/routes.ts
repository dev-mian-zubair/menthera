/**
 * Application Routes
 *
 * Centralized route constants for type-safe navigation throughout the app.
 * Import these constants instead of hardcoding route strings.
 *
 * @example
 * import { ROUTES } from '@/lib/routes';
 * router.push(ROUTES.AUTH.SIGN_IN);
 * router.push(ROUTES.CALL(agentId));
 */

export const ROUTES = {
  // ==================== AUTH ====================
  AUTH: {
    WELCOME: '/auth/welcome',
  },

  // ==================== QUESTS ====================
  /**
   * Navigate to agent-specific quest
   * @param agentId - The ID of the agent for the quest
   */
  QUEST: (agentId: string) => `/quest/${agentId}` as const,

  /**
   * Navigate to agent quest report/insights
   * @param agentId - The ID of the agent for the quest report
   */
  QUEST_REPORT: (agentId: string) => `/quest-report/${agentId}` as const,

  // ==================== MAIN TABS ====================
  TABS: {
    HOME: '/',
    CHAT: '/chat',
    CALLS: '/calls',
    PROFILE: '/profile',
  },

  /**
   * Navigate to chat screen with specific agent
   * @param agentId - The ID of the agent to chat with
   */
  CHAT_WITH_AGENT: (agentId: string) => `/(tabs)/chat?agentId=${agentId}` as const,

  // ==================== DETAIL SCREENS ====================
  /**
   * Navigate to call screen with specific agent
   * @param agentId - The ID of the agent to call
   */
  CALL: (agentId: string) => `/call/${agentId}` as const,

  /**
   * Navigate to agent detail screen
   * @param agentId - The ID of the agent to view
   */
  AGENT: (agentId: string) => `/agent/${agentId}` as const,
} as const;

/**
 * Type-safe route helper for external navigation
 */
export type Route =
  | typeof ROUTES.AUTH[keyof typeof ROUTES.AUTH]
  | typeof ROUTES.TABS[keyof typeof ROUTES.TABS]
  | ReturnType<typeof ROUTES.CALL>
  | ReturnType<typeof ROUTES.AGENT>
  | ReturnType<typeof ROUTES.QUEST>
  | ReturnType<typeof ROUTES.QUEST_REPORT>;
