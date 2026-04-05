/**
 * Quest system types for psychometric assessments and agent personalization
 * Phase 2: Domain & Execution Layer
 */

// ========================================
// DOMAIN ENUMS (FOUNDATION)
// ========================================

export enum QuestType {
  PSYCHOMETRIC = 'psychometric',
  HABIT = 'habit',
  DIAGNOSTIC = 'diagnostic',
  GOAL = 'goal',
}

export enum QuestSessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum QuestEntity {
  QUEST = 'QUEST',
  TASK = 'TASK',
  QUESTION = 'QUESTION',
  SESSION = 'SESSION',
  RESPONSE = 'RESPONSE',
  SCORE = 'SCORE',
  INSIGHT = 'INSIGHT',
}

export type ScaleType = 'LIKERT_1_7';

export type InsightType = 'summary' | 'risk_profile' | 'recommendations' | 'report';

/**
 * Report Info - Configuration for quest report display
 */
export interface ReportInfo {
  title: string;
  shortDescription: string;
  icon?: string;
  messageTemplate?: string;
}

// ========================================
// QUEST DEFINITION MODELS (STATIC TABLE)
// ========================================

/**
 * Quest Definition - Main quest metadata
 * PK = QUEST#<quest_id>#v<version>
 * SK = METADATA
 */
export interface QuestDefinition {
  pk: string; // QUEST#finance_psychometric#v1
  sk: string; // Always 'METADATA' but typed as string for DynamoDB compatibility

  entity: QuestEntity.QUEST;
  questId: string;
  version: number;
  agentId: string;
  questType: QuestType;
  title: string;
  description?: string;
  teaser?: string; // Short teaser text (max 50 chars) for quest preview
  illustration?: string; // Illustration type/icon for quest intro screen
  estimatedTimeMinutes: number;
  isActive: boolean;
  reportInfo?: ReportInfo; // Report display configuration
  reportPromptTemplate?: string; // LLM prompt template for generating psychometric analysis report
}

/**
 * Quest Task - Framework/dimension being measured
 * PK = QUEST#<quest_id>#v<version>
 * SK = TASK#<task_id>
 */
export interface QuestTask {
  pk: string; // QUEST#finance_psychometric#v1
  sk: string; // TASK#risk_tolerance

  entity: QuestEntity.TASK;
  taskId: string;
  title?: string; // Display title for the task
  description?: string; // Description of what this task measures
  illustration?: string; // Illustration type/icon for task intro screen (e.g., 'chart', 'brain', 'heart')
  framework: string; // e.g., 'big-five', 'disc', 'risk-profile'
  order: number;

  scoringLogic: {
    scale: ScaleType;
    reverseQuestions?: string[]; // Question IDs that need reverse scoring
    ranges: Record<string, [number, number]>; // Category ranges e.g., { low: [1, 2.5], medium: [2.5, 5], high: [5, 7] }
  };

  // Interpretations for score categories (optional - enriches LLM prompts)
  interpretations?: Array<{
    category: string; // matches keys in ranges (e.g., 'low', 'moderate', 'high')
    range: [number, number]; // score range for this interpretation
    label: string; // human-readable label (e.g., 'Conservative Investor')
    description: string; // what this score means
    traits?: string[]; // characteristic traits for this category
    recommendations?: string[]; // actionable recommendations
    [key: string]: any; // allow additional custom fields (e.g., riskLevel, mindsetType)
  }>;
}

/**
 * Quest Question - Individual question
 * PK = QUEST#<quest_id>#v<version>
 * SK = QUESTION#<task_id>#<question_id>
 */
export interface QuestQuestion {
  pk: string; // QUEST#finance_psychometric#v1
  sk: string; // QUESTION#risk_tolerance#q1

  entity: QuestEntity.QUESTION;
  taskId: string;
  questionId: string;
  text: string;
  scale: ScaleType;
  isReverse: boolean; // True if scoring should be reversed (7 becomes 1, etc.)
  domain?: string; // Optional sub-domain within the framework
  order: number;
}

// ========================================
// QUEST SESSION MODELS (USER EXECUTION)
// ========================================

/**
 * Quest Session - User's quest execution
 * PK = USER#<user_id>
 * SK = AGENT#<agent_id>#SESSION#<session_id>
 */
export interface QuestSession {
  pk: string; // USER#123
  sk: string; // AGENT#finance#SESSION#abc123

  entity: QuestEntity.SESSION;
  userId: string;
  agentId: string;
  questId: string;
  questVersion: number;
  status: QuestSessionStatus;
  startedAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  expiresAt?: number; // TTL for cleanup
}

/**
 * Quest Response - User's answer to a question
 * PK = USER#<user_id>
 * SK = AGENT#<agent_id>#SESSION#<session_id>#Q#<task_id>#<question_id>
 */
export interface QuestResponse {
  pk: string; // USER#123
  sk: string; // AGENT#finance#SESSION#abc123#Q#risk_tolerance#q1

  entity: QuestEntity.RESPONSE;
  taskId: string;
  questionId: string;
  value: number; // 1-7 for LIKERT_1_7
  answeredAt: string; // ISO timestamp
}

/**
 * Quest Score - Computed score for a task
 * PK = USER#<user_id>
 * SK = AGENT#<agent_id>#SESSION#<session_id>#SCORE#<task_id>
 */
export interface QuestScore {
  pk: string; // USER#123
  sk: string; // AGENT#finance#SESSION#abc123#SCORE#risk_tolerance

  entity: QuestEntity.SCORE;
  taskId: string;
  rawScore: number; // Average of responses (1-7 scale)
  normalizedScore: number; // 0-100 scale
  category: string; // e.g., 'low', 'medium', 'high'
  computedAt: string; // ISO timestamp
}

/**
 * Quest Insight - LLM-generated insight
 * PK = USER#<user_id>
 * SK = AGENT#<agent_id>#SESSION#<session_id>#INSIGHT#<insight_type>
 */
export interface QuestInsight {
  pk: string; // USER#123
  sk: string; // AGENT#finance#SESSION#abc123#INSIGHT#summary

  entity: QuestEntity.INSIGHT;
  insightType: InsightType;
  content: string;
  model: string; // LLM model used (e.g., 'gpt-4', 'claude-3')
  createdAt: string; // ISO timestamp
}

// ========================================
// LLM INTEGRATION BOUNDARY
// ========================================

/**
 * Input for LLM insight generation
 * LLM never calculates raw scores - only interprets structured results
 */
export interface LLMInsightInput {
  agentId: string;
  questType: QuestType;
  scores: Array<{
    taskId: string;
    framework: string;
    rawScore: number;
    normalizedScore: number;
    category: string;
  }>;
  responses: Array<{
    questionId: string;
    questionText: string;
    value: number;
  }>;
}

/**
 * Expected LLM output structure
 */
export interface LLMInsightOutput {
  summary: string; // Overall personality/profile summary
  riskProfile?: string; // For finance agents
  recommendations: string[]; // Actionable recommendations
  patterns: string[]; // Detected behavioral patterns
}

// ========================================
// HELPER TYPES
// ========================================

/**
 * Complete quest data (for API responses)
 */
export interface CompleteQuestData {
  definition: QuestDefinition;
  tasks: QuestTask[];
  questions: QuestQuestion[];
}

/**
 * Complete session data (for API responses)
 */
export interface CompleteSessionData {
  session: QuestSession;
  responses: QuestResponse[];
  scores: QuestScore[];
  insights: QuestInsight[];
}

/**
 * Quest completion status for agent
 */
export interface AgentQuestStatus {
  agentId: string;
  completed: boolean;
  status: QuestSessionStatus | 'not_started';
  completedAt?: string;
  sessionId?: string;
}
