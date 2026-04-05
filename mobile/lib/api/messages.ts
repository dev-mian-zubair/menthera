/**
 * Messages API
 * Handles all message-related API calls
 */
import { API_CONFIG, ApiResponse } from './config';
import { apiClient } from './client';
import { Message, ChatRequest, ChatResponse, GetMessagesParams, GetMessagesResponse, createTextMessage, getMessageText } from '@/lib/types/message';
import { logger } from '../utils/logger';

// Type for authenticated fetch function
export type AuthenticatedFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;


/**
 * Get the streaming API endpoint URL
 * This should point to the Lambda Function URL with the /message/:agentId path
 */
export function getChatStreamUrl(agentId: string): string {
  return `${API_CONFIG.CHAT_URL}message/${agentId}`;
}

export const messagesApi = {
  /**
   * Send a message to an agent
   * POST /message/:agentId to direct Lambda URL for streaming response
   * Request body: { messages: Message[], timezone?: string }
   *
   * Note: This endpoint is used with Vercel AI SDK's useChat hook
   * which handles streaming and the Vercel AI Data Stream protocol
   */
  async sendMessage(request: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    logger.info('Sending message to agent', { agentId: request.agentId });

    try {
      // Get auth token first
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const apiClientAny = apiClient as any;
      if (apiClientAny.tokenGetter) {
        try {
          const token = await apiClientAny.tokenGetter();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            logger.debug('Authorization token added to request');
          }
        } catch (error) {
          logger.warn('Failed to get auth token:', error);
        }
      }

      // Load message history to pass to Lambda
      const historyCont = await apiClient.get<any>(`/messages/${request.agentId}`, {
        limit: 20,
      });

      let messageHistory: Array<{ role: string; content: string }> = [];
      if (historyCont.success && historyCont.data) {
        const messages = Array.isArray(historyCont.data)
          ? historyCont.data
          : Array.isArray(historyCont.data?.data)
          ? historyCont.data.data
          : [];

        messageHistory = messages
          .map((msg: any) => ({
            role: msg.role || 'user',
            content: msg.content || msg.message || '',
          }))
          .slice(0, 20);
      }

      // Add current user message
      const allMessages = [
        ...messageHistory,
        {
          role: 'user',
          content: request.message,
        },
      ];

      const payload = {
        messages: allMessages,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      logger.debug('Request payload', { messageCount: allMessages.length });

      // Build URL with agent ID in path: /message/:agentId
      const url = `${API_CONFIG.CHAT_URL}message/${request.agentId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      logger.debug(`Response status: ${response.status}`);

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.text().catch(() => '');
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        logger.error('Failed to send message', errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      }

      // For streaming, return the response body as-is
      // The caller will need to handle the stream
      logger.info('Message sent successfully');

      return {
        success: true,
        data: { streaming: true } as any,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Exception sending message', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Send a message with streaming support
   * POST /message/:agentId - Returns a ReadableStream for real-time message chunks
   * Request body: { messages: Message[], timezone?: string }
   */
  async sendMessageStream(request: ChatRequest): Promise<ReadableStream<string>> {
    logger.info('Starting message stream', { agentId: request.agentId });

    // Get the token from apiClient's token getter for authentication
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Try to get auth token from apiClient (which has the Clerk token getter configured)
    const apiClientAny = apiClient as any;
    if (apiClientAny.tokenGetter) {
      try {
        const token = await apiClientAny.tokenGetter();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          logger.debug('Authorization token added to stream request');
        }
      } catch (error) {
        logger.warn('Failed to get auth token for stream:', error);
      }
    }

    // Load message history to pass to Lambda
    const historyCont = await apiClient.get<any>(`/messages/${request.agentId}`, {
      limit: 20,
    });

    let messageHistory: Array<{ role: string; content: string }> = [];
    if (historyCont.success && historyCont.data) {
      const messages = Array.isArray(historyCont.data)
        ? historyCont.data
        : Array.isArray(historyCont.data?.data)
        ? historyCont.data.data
        : [];

      messageHistory = messages
        .map((msg: any) => ({
          role: msg.role || 'user',
          content: msg.content || msg.message || '',
        }))
        .slice(0, 20);
    }

    // Add current user message
    const allMessages = [
      ...messageHistory,
      {
        role: 'user',
        content: request.message,
      },
    ];

    const payload = {
      messages: allMessages,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    logger.debug('Stream request payload', { messageCount: allMessages.length });

    // Build URL with agent ID in path: /message/:agentId
    const url = `${API_CONFIG.CHAT_URL}message/${request.agentId}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body available for streaming');
    }

    logger.debug('Stream started');
    return response.body.pipeThrough(new TextDecoderStream());
  },

  /**
   * Get message history for an agent
   * GET /messages/:agentId
   */
  async getMessages(params: GetMessagesParams): Promise<ApiResponse<Message[]>> {
    logger.info('Fetching message history', { agentId: params.agentId });

    try {
      const queryParams: Record<string, any> = {};

      if (params.limit) {
        queryParams.limit = params.limit;
      }

      if (params.offset) {
        queryParams.offset = params.offset;
      }

      if (params.conversationId) {
        queryParams.conversationId = params.conversationId;
      }

      const endpoint = `/messages/${params.agentId}`;

      logger.debug(`Request URL: ${API_CONFIG.BASE_URL}${endpoint}`);

      // Use apiClient which handles authentication
      const apiResponse = await apiClient.get<any>(endpoint, queryParams);

      if (!apiResponse.success) {
        const errorMsg = (apiResponse as any).error || 'Failed to fetch messages';
        logger.error('Failed to fetch messages', errorMsg);

        return {
          success: false,
          error: errorMsg,
        };
      }

      const data = apiResponse.data;

      // Extract messages from response
      let messages: Message[] = [];

      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          messages = data.data;
        } else if (Array.isArray(data.data.messages)) {
          messages = data.data.messages;
        }
      } else if (Array.isArray(data.data)) {
        messages = data.data;
      }

      // Ensure messages have proper format
      const formattedMessages: Message[] = messages.map((msg: any) => {
        return {
          id: msg.id || msg.messageId || `msg_${Date.now()}_${Math.random()}`,
          role: msg.role || 'user',
          parts: createTextMessage(msg.content || msg.message || ''),
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          agentId: params.agentId,
          userId: msg.userId,
          // Preserve message_type and metadata for special message types (e.g., REPORT_NOTIFICATION)
          ...(msg.message_type && { message_type: msg.message_type }),
          ...(msg.quest_id && { quest_id: msg.quest_id }),
          ...(msg.session_id && { session_id: msg.session_id }),
          ...(msg.report_title && { report_title: msg.report_title }),
          ...(msg.report_description && { report_description: msg.report_description }),
          ...(msg.report_icon && { report_icon: msg.report_icon }),
          ...(msg.agent_id && { agent_id: msg.agent_id }),
          ...(msg.timestamp && { timestamp: msg.timestamp }),
        };
      });

      logger.info(`✓ Retrieved ${formattedMessages.length} messages`);

      return {
        success: true,
        data: formattedMessages,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Exception fetching messages', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Clear/delete all messages in a conversation
   */
  async clearMessages(agentId: string, conversationId?: string): Promise<ApiResponse<void>> {
    logger.info('Clearing messages', { agentId, conversationId });

    try {
      const endpoint = `/messages/${agentId}`;

      // Use apiClient which handles authentication
      const apiResponse = await apiClient.delete<void>(endpoint);

      if (!apiResponse.success) {
        const errorMsg = (apiResponse as any).error || 'Failed to clear messages';
        logger.error('Failed to clear messages', errorMsg);

        return {
          success: false,
          error: errorMsg,
        };
      }

      logger.info('Messages cleared successfully');

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Exception clearing messages', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
