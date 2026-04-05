/**
 * Message Types and Interfaces
 * Defines data structures for chat messaging system
 */

/**
 * Role of the message sender
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message types for special handling
 */
export type MessageType = 'REPORT_NOTIFICATION' | null;

/**
 * UI Message Part - v5 format
 */
export interface TextUIPart {
  type: 'text';
  text: string;
}

export type UIMessagePart = TextUIPart;

/**
 * UI Message - v5 format with parts array
 * Matches AI SDK v5 UIMessage structure
 */
export interface Message {
  id: string;
  role: MessageRole;
  parts: UIMessagePart[];
  createdAt?: Date;
  agentId?: string;
  userId?: string;
  status?: 'sending' | 'sent' | 'error';
  error?: string;
  message_type?: MessageType;
}

/**
 * Report Notification Message
 * Special message type for quest completion notifications
 */
export interface ReportNotificationMessage extends Message {
  message_type: 'REPORT_NOTIFICATION';
  quest_id: string;
  session_id: string;
  report_title: string;
  report_description: string;
  report_icon?: string;
}

/**
 * Helper function to create a text message
 */
export function createTextMessage(text: string): UIMessagePart[] {
  return [{ type: 'text', text }];
}

/**
 * Helper function to extract text content from message parts
 */
export function getMessageText(parts: UIMessagePart[]): string {
  return parts
    .filter((part): part is TextUIPart => part.type === 'text')
    .map(part => part.text)
    .join('');
}

/**
 * Chat Request - payload for sending a message
 */
export interface ChatRequest {
  message: string;
  agentId: string;
  userId: string;
  conversationId?: string;
  context?: Record<string, any>;
}

/**
 * Chat Response - response from sending a message (streaming)
 */
export interface ChatResponse {
  success: boolean;
  data?: {
    messageId: string;
    content: string;
    agentId: string;
    timestamp: string;
    conversationId?: string;
  };
  error?: string;
}

/**
 * Chat History Request Params
 */
export interface GetMessagesParams {
  agentId: string;
  limit?: number;
  offset?: number;
  conversationId?: string;
}

/**
 * Chat History Response
 */
export interface GetMessagesResponse {
  success: boolean;
  data?: {
    messages: Message[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

/**
 * Streaming Message Chunk
 * Represents a chunk of streamed message content
 */
export interface MessageChunk {
  id: string;
  delta: string;
  index: number;
  finished: boolean;
}

/**
 * Chat State
 * Represents the state of a chat conversation
 */
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  isStreaming: boolean;
  error: string | null;
  typingIndicator: boolean;
  agentId: string;
}

/**
 * Streaming State for message queue management
 */
export interface StreamingState {
  renderMessages: Message[];
  queue: MessageChunk[];
  status: 'idle' | 'streaming' | 'processing';
  currentMessageId: string | null;
  pendingRefetch: boolean;
}
