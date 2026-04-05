/**
 * Message types for streaming message service
 */

export interface Message {
  message_id: string;
  user_id: string;
  agent_id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  type?: 'text' | 'image' | 'file';
  timestamp: string;
  created_at: string;
  // createdAt can be in multiple formats for flexibility
  createdAt?: number | string | Date;
  timezone?: string;
  // Token tracking for AI responses
  tokens_input?: number;
  tokens_output?: number;
  tokens_total?: number;
}

export interface StreamMessage {
  type: 'message_received' | 'message_stream' | 'stream_complete' | 'error';
  message_id?: string;
  content?: string;
  chunk_index?: number;
  timestamp?: string;
  error?: string;
}
