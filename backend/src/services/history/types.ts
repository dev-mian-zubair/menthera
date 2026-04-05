/**
 * History API types - unified calls and messages
 */

export interface Call {
  call_id: string;
  user_id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar?: string;
  type: 'audio';
  status: 'initiated' | 'in_progress' | 'completed' | 'missed' | 'failed';
  duration: number;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  message_id: string;
  user_id: string;
  agent_id: string;
  content: string;
  role: 'user' | 'assistant';
  type?: 'text' | 'image' | 'file';
  timestamp: string;
  created_at: string;
}

export interface CallsResponse {
  success: boolean;
  data?: {
    calls: Call[];
    pagination: {
      offset: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

export interface CallDetailResponse {
  success: boolean;
  data?: Call & {
    agent?: {
      name: string;
      avatar?: string;
    };
  };
  error?: string;
}

export interface ConversationResponse {
  success: boolean;
  data?: {
    agent_id: string;
    agent_name?: string;
    agent_avatar?: string;
    messages: Message[];
    pagination: {
      offset: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
  error?: string;
}
