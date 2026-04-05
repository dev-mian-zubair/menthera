// Conversations/Chat API module
import { apiClient } from './client';
import { ApiResponse } from './config';
import { Conversation, Message } from '@/lib/types';

export const conversationsApi = {
  /**
   * GET /api/conversations - Get all conversations (simplified)
   */
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return apiClient.get<Conversation[]>('/conversations');
  },

  /**
   * GET /api/conversations/:agentId/messages - Get messages from conversation
   */
  async getMessages(agentId: string): Promise<ApiResponse<Message[]>> {
    return apiClient.get<Message[]>(`/conversations/${agentId}/messages`);
  },

  /**
   * POST /api/conversations/:agentId/messages - Send message to agent
   */
  async sendMessage(
    agentId: string,
    content: string
  ): Promise<ApiResponse<Message>> {
    return apiClient.post<Message>(`/conversations/${agentId}/messages`, {
      content,
      type: 'user',
    });
  },

};