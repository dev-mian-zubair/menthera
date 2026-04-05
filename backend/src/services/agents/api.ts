import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { handle } from 'hono/aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { getAuth } from '@hono/clerk-auth';
import customClerkMiddleware from '../../shared/auth-middleware';
import {
  buildHonoSuccess,
  buildHonoErrorResponse,
} from '../../shared/utils/response-builder';
import { getQuestDefinition } from '../quests/quest-definitions-helpers';
import { QuestKeys } from '../quests/quest-utils';

const app = new Hono();

app.use(logger());
app.use('*', customClerkMiddleware);
app.use('*', cors());

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

const QUEST_SESSIONS_TABLE_NAME = process.env.QUEST_SESSIONS_TABLE_NAME || 'quest-sessions';

// Type definitions
interface ReportInfo {
  title: string;
  shortDescription: string;
  icon?: string;
}

interface QuestStatusMap {
  agentId: string;
  status: 'completed' | 'in_progress';
  questId: string;
  questVersion: number;
  sessionId: string;
  completedAt?: string;
  reportReady?: boolean;
  reportInfo?: ReportInfo;
}

interface Agent {
  agent_id: string;
  agent_type: string;
  name: string;
  avatar: string;
  description: string;
  teaser?: string;
  specialties?: string[];
  colors?: {
    primary: string;
    light: string;
  };
  order: number;
  quest_id?: string;
  quest_version?: number;
}

// GET /agents - Fetch all agents (public) or with user's personalization status (authenticated)
app.get('/agents', async (c) => {
  try {
    const auth = getAuth(c);
    const isAuthenticated = !!auth?.userId;
    console.log('[Agents API] GET /agents called', {
      isAuthenticated,
      userId: auth?.userId || 'none'
    });

    // Fetch all agents from database
    const agentsResult = await db.send(new ScanCommand({
      TableName: process.env.AGENTS_TABLE_NAME || 'agents',
    }));

    const agents = (agentsResult.Items || []) as Agent[];
    console.log('[Agents API] Fetched agents from DB:', agents.length);

    let sortedAgents;

    if (isAuthenticated) {
      // AUTHENTICATED: Return full agent info with user-specific data
      const userId = auth.userId;

      // Fetch user data to check their plan
      const userResult = await db.send(new GetCommand({
        TableName: process.env.USERS_TABLE_NAME || 'users',
        Key: {
          user_id: userId,
        },
      }));

      const userPlan = (userResult.Item?.plan as string) || 'inactive';
      console.log('[Agents API] User plan:', userPlan);

      // Fetch all quest sessions for this user
      // PK = USER#<user_id>, SK begins with AGENT#
      const pk = `USER#${userId}`;
      const questSessionsResult = await db.send(
        new QueryCommand({
          TableName: QUEST_SESSIONS_TABLE_NAME,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
          FilterExpression: 'entity = :entity',
          ExpressionAttributeValues: {
            ':pk': pk,
            ':skPrefix': 'AGENT#',
            ':entity': 'SESSION',
          },
        })
      );

      const questSessions = questSessionsResult.Items || [];
      console.log('[Agents API] Fetched quest sessions:', questSessions.length);

      // Create a map of (agentId + questId + questVersion) -> quest status
      // This ensures we match sessions to the agent's primary quest
      const questMap = new Map<string, QuestStatusMap>();

      for (const session of questSessions) {
        const agentId = session.agentId;
        const questId = session.questId;
        const questVersion = session.questVersion;
        const status = session.status;

        // Create composite key
        const mapKey = `${agentId}#${questId}#${questVersion}`;
        const existing = questMap.get(mapKey);

        // Priority: completed > in_progress
        if (status === 'completed') {
          // Keep most recent completed session
          if (!existing || existing.status !== 'completed' || (session.completedAt && existing.completedAt && session.completedAt > existing.completedAt)) {
            // Extract sessionId from SK: AGENT#<agentId>#SESSION#<sessionId>
            const sessionId = session.sk.split('#SESSION#')[1];

            questMap.set(mapKey, {
              agentId,
              status: 'completed',
              questId: session.questId,
              questVersion: session.questVersion,
              sessionId: sessionId,
              completedAt: session.completedAt,
              reportReady: session.reportReady || false,
            });
          }
        } else if (status === 'in_progress' && !existing) {
          // Only set in_progress if no existing session
          const sessionId = session.sk.split('#SESSION#')[1];

          questMap.set(mapKey, {
            agentId,
            status: 'in_progress',
            questId: session.questId,
            questVersion: session.questVersion,
            sessionId: sessionId,
            reportReady: false,
          });
        }
      }

      // Fetch quest definitions for sessions with reportReady = true
      // Use questDefinitionsTable to get reportInfo
      const QUEST_DEFINITIONS_TABLE_NAME = process.env.QUEST_DEFINITIONS_TABLE_NAME || 'quest-definitions';
      const questDefinitionsMap = new Map<string, ReportInfo>();

      for (const [mapKey, quest] of questMap.entries()) {
        if (quest.reportReady && quest.questId && quest.questVersion) {
          const questKey = `${quest.questId}#v${quest.questVersion}`;

          // Skip if already fetched
          if (questDefinitionsMap.has(questKey)) {
            continue;
          }

          try {
            // Fetch quest definition using helper
            const questData = await getQuestDefinition(db, quest.questId, quest.questVersion);

            if (questData?.definition?.reportInfo) {
              questDefinitionsMap.set(questKey, questData.definition.reportInfo);
              console.log('[Agents API] Fetched reportInfo for quest:', questKey, questData.definition.reportInfo);
            }
          } catch (error) {
            console.error('[Agents API] Error fetching quest definition:', questKey, error);
          }
        }
      }

      // Update questMap with reportInfo
      for (const [mapKey, quest] of questMap.entries()) {
        if (quest.reportReady && quest.questId && quest.questVersion) {
          const questKey = `${quest.questId}#v${quest.questVersion}`;
          const reportInfo = questDefinitionsMap.get(questKey);

          if (reportInfo) {
            quest.reportInfo = reportInfo;
          }
        }
      }

      console.log('[Agents API] Fetched quest definitions with reportInfo:', questDefinitionsMap.size);

      // Format agents response with quest/onboarding status
      const formattedAgents = agents.map((agent: Agent) => {
        // Look up session status for this agent's primary quest
        let questStatus = null;

        if (agent.quest_id && agent.quest_version) {
          const mapKey = `${agent.agent_id}#${agent.quest_id}#${agent.quest_version}`;
          questStatus = questMap.get(mapKey);
        }

        // Compute CTA text based on status
        // - not_started: "✨ Personalize {AgentName} →"
        // - in_progress: "Continue Personalizing {AgentName} →"
        // - completed: "🟢 Personalized for you"
        let ctaText = `✨ Personalize ${agent.name}   →`;
        if (questStatus) {
          if (questStatus.status === 'in_progress') {
            ctaText = `Continue Personalizing ${agent.name}   →`;
          } else if (questStatus.status === 'completed') {
            ctaText = '🟢 Personalized for you';
          }
        }

        return {
          agent_id: agent.agent_id,
          agent_type: agent.agent_type,
          name: agent.name,
          avatar: agent.avatar,
          description: agent.description,
          teaser: agent.teaser,
          specialties: agent.specialties || [],
          colors: agent.colors || {
            primary: '#6366f1',
            light: '#e0e7ff',
          },
          order: agent.order,
          isLocked: false,
          personalization: questStatus ? {
            status: questStatus.status,
            questId: questStatus.questId,
            questVersion: questStatus.questVersion,
            sessionId: questStatus.sessionId,
            completedAt: questStatus.completedAt,
            reportReady: questStatus.reportReady || false,
            reportInfo: questStatus.reportInfo || undefined,
            ctaText: ctaText,
          } : {
            status: 'not_started',
            questId: agent.quest_id || null,
            questVersion: agent.quest_version || null,
            reportReady: false,
            ctaText: `✨ Personalize ${agent.name}   →`,
          },
          // Note: call_prompt and message_prompt are intentionally excluded
          // These will be fetched separately when needed for actual interactions
        };
      });

      console.log('[Agents API] Formatted agents with quest status:', formattedAgents.length);

      // Sort agents by order field
      sortedAgents = formattedAgents.sort((a, b) => a.order - b.order);
    } else {
      // UNAUTHENTICATED: Return basic agent info only (for onboarding)
      console.log('[Agents API] Unauthenticated request - returning basic agent info');

      sortedAgents = agents
        .map((agent: Agent) => ({
          agent_id: agent.agent_id,
          name: agent.name,
          avatar: agent.avatar,
          description: agent.description,
          teaser: agent.teaser,
          specialties: agent.specialties || [],
          colors: agent.colors || {
            primary: '#6366f1',
            light: '#e0e7ff',
          },
          order: agent.order,
        }))
        .sort((a, b) => a.order - b.order);
    }

    console.log('[Agents API] GET /agents COMPLETE RESPONSE:', JSON.stringify(sortedAgents, null, 2));

    return buildHonoSuccess(c, sortedAgents, `Found ${sortedAgents.length} agents`);
  } catch (error: any) {
    console.error('[Agents API] Error:', error);
    return buildHonoErrorResponse(c, error);
  }
});

export const handler = handle(app);
