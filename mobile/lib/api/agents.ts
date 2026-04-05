// Agents/Experts API module
import { apiClient } from './client';
import { ApiResponse, API_CONFIG } from './config';
import { Agent } from '@/lib/types';
import { logger } from '../utils/logger';

// Activity type definition
export interface AgentActivity {
  id: string;
  type: 'chat' | 'call';
  userId: string;
  userName: string;
  timestamp: Date;
  duration?: number; // in seconds (for calls)
  messageCount?: number; // for chats
  status: 'completed' | 'missed' | 'ongoing';
  summary?: string;
}

// Paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}


export const agentsApi = {
  /**
   * GET /agents - Get all agents information from backend
   * Maps backend response to frontend Agent type
   * Uses apiClient for consistent request handling
   * Fetches fresh data on every call (no caching)
   */
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    logger.info('Fetching agents from backend...');
    logger.debug(`API Config - BASE_URL: ${API_CONFIG.BASE_URL}`);

    try {
      logger.info('Fetching from backend API...');
      logger.debug(`Request URL: ${API_CONFIG.BASE_URL}/agents`);

      // Use apiClient for the request
      const response = await apiClient.get<any>('/agents');

      logger.debug('API response received', { success: response.success });

      // Check if apiClient returned an error
      if (!response.success) {
        logger.error('API returned error response', { error: response.error });
        return {
          success: false,
          error: response.error || 'Failed to fetch agents',
        };
      }

      // Backend wraps response in {success, data, message, ...}
      // Extract the actual agents array from the data field
      let backendAgents = response.data;

      // If response.data is an object with a 'data' property (wrapped response),
      // extract the agents array from it
      if (backendAgents && typeof backendAgents === 'object' && !Array.isArray(backendAgents) && backendAgents.data) {
        logger.debug('Unwrapping wrapped response format', { hasData: !!backendAgents.data });
        backendAgents = backendAgents.data;
      }

      // Validate response is array
      if (!Array.isArray(backendAgents)) {
        logger.error('Invalid response format - expected array', { received: typeof backendAgents, data: backendAgents });
        return {
          success: false,
          error: 'Invalid response format from server',
        };
      }

      logger.info(`✓ Received ${backendAgents.length} agents from backend`);
      logger.debug('Raw backend response', { agents: backendAgents });
      logger.debug('COMPLETE BACKEND AGENTS RESPONSE:', JSON.stringify(backendAgents, null, 2));

      // Map backend agent format to frontend Agent type
      const agents: Agent[] = backendAgents.map((agent: any, index: number) => {
        logger.debug(`Mapping agent ${index + 1}`, {
          agent_id: agent.agent_id,
          name: agent.name,
          has_colors: !!agent.colors,
          has_personalization: !!agent.personalization,
        });

        return {
          id: agent.agent_id, // Map agent_id to id
          name: agent.name,
          avatar: agent.avatar,
          description: agent.description,
          teaser: agent.teaser, // Short teaser for home feed
          specialties: agent.specialties || [],
          colors: agent.colors || {
            primary: '#6366f1',
            light: '#e0e7ff',
          },
          order: agent.order || index + 1,
          isLocked: agent.isLocked || false, // Map isLocked field
          personalization: agent.personalization || {
            status: 'not_started',
            questId: null,
            questVersion: null,
            ctaText: 'Make Personalized',
          },
        };
      });

      logger.info(`✓ Successfully mapped ${agents.length} agents`, {
        agents: agents.map(a => ({ id: a.id, name: a.name })),
      });

      return {
        success: true,
        data: agents,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : '';

      logger.error('Exception caught during agents fetch', {
        message: errorMessage,
        stack: errorStack,
        error: error,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
