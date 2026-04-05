// Data models for the Yara app

export type AgentCategory =
  | 'career-business'
  | 'health-fitness'
  | 'learning-education'
  | 'mental-wellness'
  | 'productivity';

export interface AgentCategoryInfo {
  id: AgentCategory;
  name: string;
  description: string;
  icon?: string;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  description: string;
  teaser?: string;     // Short teaser text for home feed (45-50 chars)
  specialties: string[];
  colors?: {
    primary: string;   // Main vibrant color
    light: string;     // Lighter tint for backgrounds
  };
  order: number;       // Display order (1-5)
  isLocked: boolean;   // Whether agent is locked for current user's plan
  personalization?: {
    status: 'not_started' | 'in_progress' | 'completed';
    questId: string | null;
    questVersion: number | null;
    sessionId?: string;        // Present when status is in_progress or completed
    completedAt?: string;      // ISO timestamp when status is completed
    reportReady?: boolean;     // True when insights report is ready to view
    reportInfo?: {             // Report metadata from quest definition
      title: string;
      shortDescription: string;
      icon?: string;
    };
    ctaText: string;          // CTA button text based on status
  };
}

export interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  agentId: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
}

/**
 * Insights extracted from call by LLM
 */
export interface CallInsights {
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  importance: 'low' | 'medium' | 'high';
  keyFacts: string[];
  userPreferences: string[];
}

export interface CallHistory {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  type: 'audio' | 'video';
  duration: number; // in seconds
  timestamp: Date;
  status: 'completed' | 'missed' | 'declined' | 'in_progress' | 'ended' | 'failed';

  // Summary & insights (populated asynchronously by call processor)
  summary?: string;
  insights?: CallInsights;
  memoryExtracted?: boolean;
  processedAt?: Date;
}

export interface HistoryItem {
  id: string;
  type: 'chat' | 'call';
  agentId: string;
  agentName: string;
  agentAvatar: string;
  timestamp: Date;
  preview?: string; // for chat: last message, for call: call status
  duration?: number; // for calls only
  callType?: 'audio' | 'video'; // for calls only
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  googleId: string;
}

// ========================================
// REPORT TYPES
// ========================================

export interface ReportSubsection {
  title: string;
  content: string; // Markdown formatted content
}

export interface ReportSection {
  id: string;
  title: string;
  icon: string; // Emoji
  summary: string;
  subsections: ReportSubsection[];
  order: number;
}

export interface ReportData {
  title: string;
  description: string;
  sections: ReportSection[];
  generatedAt: string; // ISO timestamp
  model: string; // LLM model used (e.g., 'gemini-2.5-flash')
}

export interface AgentReport {
  sessionId: string;
  questId: string;
  questVersion: number;
  completedAt: string; // ISO timestamp
  reportData: ReportData;
  reportReady: boolean;
}