// Call API module
import { apiClient } from './client';
import { ApiResponse, PaginationParams } from './config';
import { CallHistory } from '@/lib/types';
import { logger } from '../utils/logger';

export interface CallSession {
  id: string;
  agentId: string;
  type: 'audio' | 'video';
  status: 'connecting' | 'connected' | 'ended';
  startTime: Date;
  roomUrl: string;
  token: string;
  roomName?: string;
  taskArn?: string;
  roomReused?: boolean;
  assignmentMethod?: 'warm-pool' | 'cold-start';
  quota?: {
    used: number;
    total: number;
    remaining: number;
    resetDate: string;
  };
}

export interface CallRequest {
  agentId: string;
  type: 'audio' | 'video';
}

export const callsApi = {
  /**
   * POST /call - Initiate call with agent (returns roomUrl and token)
   * Backend returns: { roomUrl, userToken, callId, roomName, taskArn, roomReused }
   */
  async initiateCall(request: CallRequest): Promise<ApiResponse<CallSession>> {
    try {
      // Call backend /call endpoint
      const response = await apiClient.post<any>('/call', request);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to initiate call',
        };
      }

      const backendData = response.data;

      logger.debug('[Calls API] 📞 Call initiated:', {
        callId: backendData.callId,
        roomUrl: backendData.roomUrl?.substring(0, 50) + '...',
        roomReused: backendData.roomReused,
      });

      // Map backend response to CallSession
      const callSession: CallSession = {
        id: backendData.callId,
        agentId: request.agentId,
        type: request.type,
        status: 'connecting',
        startTime: new Date(),
        roomUrl: backendData.roomUrl,
        token: backendData.userToken,
        roomName: backendData.roomName,
        taskArn: backendData.taskArn,
        roomReused: backendData.roomReused,
        assignmentMethod: backendData.assignmentMethod,
        quota: backendData.quota,
      };

      return {
        success: true,
        data: callSession,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('[Calls API] ✗ Call initiation error:', errorMsg);

      return {
        success: false,
        error: errorMsg,
      };
    }
  },


  /**
   * GET /api/calls/:id - Get call session details
   */
  async getCallSession(callId: string): Promise<ApiResponse<CallSession>> {
    return apiClient.get<CallSession>(`/calls/${callId}`);
  },

  /**
   * GET /calls/history - Get call history with pagination
   * Backend returns: { calls: CallHistory[], pagination: {...} }
   */
  async getCallHistory(params?: PaginationParams): Promise<ApiResponse<CallHistory[]>> {
    try {
      // Call the backend endpoint
      const response = await apiClient.get<any>('/calls/history', params);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch call history',
        };
      }

      // Backend returns { calls: [...], pagination: {...} }
      // Extract just the calls array for the response
      const backendData = response.data;

      logger.debug('[Calls API] 🔍 Response data structure:', {
        type: typeof backendData,
        isObject: backendData && typeof backendData === 'object',
        hasCallsProperty: backendData && 'calls' in backendData,
        callsType: backendData && typeof backendData.calls,
        isCallsArray: backendData && Array.isArray(backendData.calls),
        callsLength: backendData && Array.isArray(backendData.calls) ? backendData.calls.length : 'N/A',
        keys: backendData ? Object.keys(backendData) : 'N/A',
      });

      if (backendData && Array.isArray(backendData.calls)) {
        logger.debug('[Calls API] ✓ Received', backendData.calls.length, 'calls from backend');
        logger.debug('[Calls API] ℹ Pagination:', backendData.pagination);

        // Transform snake_case properties to camelCase and convert date strings to Date objects
        const transformedCalls = backendData.calls.map((call: any) => ({
          id: call.call_id,
          agentId: call.agent_id,
          agentName: call.agent_name,
          agentAvatar: call.agent_avatar,
          status: call.status,
          duration: call.duration || 0,
          // Use started_at as the main timestamp field
          timestamp: call.started_at ? new Date(call.started_at) : new Date(),
          type: call.type,

          // Summary & insights (populated asynchronously by call processor)
          summary: call.summary,
          memoryExtracted: call.memory_extracted,
          processedAt: call.processed_at ? new Date(call.processed_at) : undefined,
          // Transform insights snake_case to camelCase
          insights: call.insights
            ? {
                topics: call.insights.topics || [],
                sentiment: call.insights.sentiment || 'neutral',
                importance: call.insights.importance || 'medium',
                keyFacts: call.insights.keyFacts || call.insights.key_facts || [],
                userPreferences: call.insights.userPreferences || call.insights.user_preferences || [],
              }
            : undefined,
        }));

        return {
          success: true,
          data: transformedCalls,
        };
      } else if (Array.isArray(backendData)) {
        // Fallback: if backend returns just an array
        logger.debug('[Calls API] ✓ Received', backendData.length, 'calls (array format)');
        return {
          success: true,
          data: backendData,
        };
      } else {
        logger.error('[Calls API] ✗ Invalid response format:', JSON.stringify(backendData).substring(0, 500));
        return {
          success: false,
          error: 'Invalid response format from server',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('[Calls API] ✗ Exception:', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};