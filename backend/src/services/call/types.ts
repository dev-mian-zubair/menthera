/**
 * Request/Response types for create-call handler
 */

export interface CreateCallRequest {
  agentId: string; // Required - agent to call (audio-only)
}

export interface CreateCallResponse {
  success: boolean;
  data?: {
    callId: string;
    roomUrl: string;
    roomName: string;
    userToken: string;
    taskArn: string;
    roomReused: boolean; // Whether room was reused or newly created
    assignmentMethod?: 'warm-pool' | 'cold-start'; // NEW: Method used for bot assignment
    // ⚡ Quota information for client-side monitoring
    quota: {
      used?: number;
      total?: number;
      remaining?: number;
      resetDate?: string;
      unlimited?: boolean;
    };
  };
  error?: string;
  errorCode?: string; // Error code for special handling (e.g., QUOTA_EXCEEDED)
  // Quota info also included in error response for QUOTA_EXCEEDED errors
  quota?: {
    used: number;
    total: number;
    remaining: number;
    resetDate: string;
  };
}

/**
 * Daily.co API response types
 */

export interface DailyRoomResponse {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: {
    max_participants?: number;
    enable_chat?: boolean;
    enable_screenshare?: boolean;
  };
}

export interface DailyTokenResponse {
  token: string;
}

/**
 * Agent information type
 */

export interface AgentInfo {
  agent_id: string;
  name: string;
  agent_type: string;
  description?: string;
  avatar?: string;
  voice_id?: string;
  voice_emotion?: string;
  call_prompt?: string;
  message_prompt?: string;
}

/**
 * Call record from DynamoDB calls table
 */
export interface CallRecord {
  user_id: string;
  call_id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar?: string;
  type: 'audio' | 'video';
  status: 'initiated' | 'in_progress' | 'ending' | 'completed' | 'ended' | 'failed';
  duration?: number;
  started_at: string;
  ended_at?: string;
  user_left_at?: string;
  created_at: string;
  updated_at: string;
  task_arn?: string;
  room_url?: string;
  daily_room_name?: string;
  transcript?: string;
}
