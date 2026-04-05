import { MemoryClient } from 'mem0ai';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * Memory search result interface based on Mem0 API response
 */
export interface Memory {
  id?: string;
  memory: string;
  hash?: string;
  metadata?: Record<string, any>;
  categories?: string[];
  created_at?: string | Date;
  updated_at?: string | Date;
  user_id?: string;
}

/**
 * Options for searching memories
 */
export interface MemorySearchOptions {
  threshold?: number;
  enable_graph?: boolean;
  filters?: Record<string, any>;
}

/**
 * Options for adding memories
 */
export interface MemoryAddOptions {
  user_id: string;
  agent_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Message format for Mem0 API
 */
export interface Mem0Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Mem0 API response can have different shapes
 */
interface Mem0SearchResponse {
  results?: Memory[];
  relations?: unknown[];
}

/**
 * Default threshold for memory search similarity scoring.
 * Lower values return more results (more permissive).
 * Higher values return fewer, more relevant results.
 * Can be overridden via MEM0_SEARCH_THRESHOLD env var.
 */
const DEFAULT_SEARCH_THRESHOLD = 0.1;

/**
 * Service for managing memories via Mem0 Platform API
 * Handles lazy initialization, error recovery, and response formatting
 */
export class Mem0Client {
  private static client: MemoryClient | null = null;
  private static apiKey: string | null = null;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Get the configured search threshold from environment or use default
   */
  private static getDefaultThreshold(): number {
    const envThreshold = process.env.MEM0_SEARCH_THRESHOLD;
    if (envThreshold) {
      const parsed = parseFloat(envThreshold);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
      }
      console.warn(`[Mem0Client] Invalid MEM0_SEARCH_THRESHOLD: ${envThreshold}, using default ${DEFAULT_SEARCH_THRESHOLD}`);
    }
    return DEFAULT_SEARCH_THRESHOLD;
  }

  /**
   * Lazy initialization of Mem0 client with singleton pattern
   */
  private static async initialize(): Promise<void> {
    // If already initializing, wait for that to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If already initialized, return immediately
    if (this.client) {
      return;
    }

    // Start initialization
    this.initializationPromise = (async () => {
      try {
        if (!this.apiKey) {
          this.apiKey = await this.getApiKey();
        }

        if (!this.apiKey) {
          throw new Error('MEM0_API_KEY not found in secrets');
        }

        this.client = new MemoryClient({ apiKey: this.apiKey });
        console.log('[Mem0Client] Successfully initialized');
      } catch (error) {
        console.error('[Mem0Client] Failed to initialize:', error);
        this.client = null;
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Get Mem0 API key from AWS Secrets Manager
   */
  private static async getApiKey(): Promise<string | null> {
    try {
      const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
      const response = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: process.env.APP_SECRET_NAME })
      );

      const secrets = JSON.parse(response.SecretString || '{}');
      return secrets.MEM0_API_KEY || null;
    } catch (error) {
      console.error('[Mem0Client] Failed to get API key:', error);
      return null;
    }
  }

  /**
   * Get initialized client instance
   */
  private static async getClient(): Promise<MemoryClient | null> {
    try {
      await this.initialize();
      return this.client;
    } catch (error) {
      console.error('[Mem0Client] Failed to get client:', error);
      return null;
    }
  }

  /**
   * Search for relevant memories based on query text
   *
   * @param query - Search query text
   * @param userId - User ID to filter memories
   * @param agentId - Optional agent ID for filtering
   * @param options - Additional search options (threshold, filters, graph)
   * @returns Array of matching memories, empty array on error
   *
   * @example
   * const memories = await Mem0Client.search(
   *   'What are my preferences?',
   *   'user123',
   *   'agent456',
   *   { threshold: 0.3, filters: { importance: { in: ['high', 'medium'] } } }
   * );
   */
  static async search(
    query: string,
    userId: string,
    agentId?: string,
    options?: Partial<MemorySearchOptions>
  ): Promise<Memory[]> {
    const client = await this.getClient();
    if (!client) {
      console.warn('[Mem0Client] Client not initialized, returning empty memories');
      return [];
    }

    try {
      const threshold = options?.threshold ?? this.getDefaultThreshold();
      const searchOptions: any = {
        user_id: userId,
        threshold,
        ...(agentId && { agent_id: agentId }),
        ...(options?.filters && { filters: options.filters }),
      };

      console.log('[Mem0Client] Searching memories:', {
        query: query.substring(0, 50) + '...',
        userId,
        agentId,
        threshold,
      });

      const response = await client.search(query, searchOptions);

      // Handle different Mem0 API response formats
      // The API can return either:
      // 1. An array directly: [{ memory: "...", ... }, ...]
      // 2. An object with results property: { results: [...], relations: [...] }
      let memories: Memory[] = [];

      if (Array.isArray(response)) {
        memories = response as Memory[];
      } else if (response && typeof response === 'object' && 'results' in response) {
        const structuredResponse = response as Mem0SearchResponse;
        memories = structuredResponse.results || [];
      } else {
        console.warn('[Mem0Client] Unexpected response format, returning empty array');
      }

      console.log(`[Mem0Client] Found ${memories.length} memories`);
      return memories;
    } catch (error) {
      console.error('[Mem0Client] Memory search failed:', error);
      return []; // Fail gracefully - don't block the request
    }
  }

  /**
   * Add new memories from conversation messages
   *
   * @param messages - Array of conversation messages
   * @param options - Options including user_id, agent_id, metadata
   * @returns Array of memory IDs if successful, empty array on error
   *
   * @example
   * const memoryIds = await Mem0Client.add(
   *   [
   *     { role: 'user', content: 'I love pizza' },
   *     { role: 'assistant', content: 'Great! I'll remember that.' }
   *   ],
   *   {
   *     user_id: 'user123',
   *     agent_id: 'agent456',
   *     metadata: { conversation_type: 'text_chat', importance: 'high' }
   *   }
   * );
   */
  static async add(
    messages: Mem0Message[],
    options: MemoryAddOptions
  ): Promise<string[]> {
    if (!messages || messages.length === 0) {
      console.warn('[Mem0Client] No messages provided, skipping add');
      return [];
    }

    const client = await this.getClient();
    if (!client) {
      console.warn('[Mem0Client] Client not initialized, skipping memory storage');
      return [];
    }

    try {
      const addOptions: any = {
        user_id: options.user_id,
        ...(options.agent_id && { agent_id: options.agent_id }),
        ...(options.metadata && { metadata: options.metadata }),
      };

      console.log('[Mem0Client] Adding memories:', {
        userId: options.user_id,
        agentId: options.agent_id,
        messageCount: messages.length,
        metadata: options.metadata,
      });

      const response = await client.add(messages, addOptions);

      // Extract memory IDs from response
      let memoryIds: string[] = [];

      if (Array.isArray(response)) {
        memoryIds = response.map((r: any) => r.id).filter(Boolean);
      } else if (response && typeof response === 'object' && 'results' in response) {
        const results = (response as any).results || [];
        memoryIds = results.map((r: any) => r.id).filter(Boolean);
      }

      console.log(`[Mem0Client] Successfully added ${memoryIds.length} memories`);
      return memoryIds;
    } catch (error) {
      console.error('[Mem0Client] Failed to add memories:', error);
      return [];
    }
  }

  /**
   * Get all memories for a user
   *
   * @param userId - User ID
   * @param agentId - Optional agent ID for filtering
   * @param filters - Additional filters
   * @returns Array of memories
   *
   * @example
   * const memories = await Mem0Client.getAll('user123', 'agent456', {
   *   importance: { eq: 'high' }
   * });
   */
  static async getAll(
    userId: string,
    agentId?: string,
    filters?: Record<string, any>
  ): Promise<Memory[]> {
    const client = await this.getClient();
    if (!client) {
      console.warn('[Mem0Client] Client not initialized');
      return [];
    }

    try {
      const options: any = {
        user_id: userId,
        ...(agentId && { agent_id: agentId }),
        ...(filters && { filters }),
      };

      console.log('[Mem0Client] Getting all memories:', { userId, agentId });

      const response = await client.getAll(options);

      let memories: Memory[] = [];

      if (Array.isArray(response)) {
        memories = response as Memory[];
      } else if (response && typeof response === 'object' && 'results' in response) {
        const structuredResponse = response as Mem0SearchResponse;
        memories = structuredResponse.results || [];
      }

      console.log(`[Mem0Client] Retrieved ${memories.length} total memories`);
      return memories;
    } catch (error) {
      console.error('[Mem0Client] Failed to get all memories:', error);
      return [];
    }
  }

  /**
   * Format memory search results into a token-efficient string for LLM context
   *
   * Extracts only essential information (memory text, created date, updated date)
   * and formats in a clean, readable format for LLM consumption.
   *
   * @param memories - Array of memory objects from search results
   * @returns Formatted string with memories, or empty string if no memories
   *
   * @example
   * const formatted = Mem0Client.formatMemories(memories);
   * Output:
   * 1. User prefers vegetarian food
   *    Created: November 9, 2025
   *
   * 2. User likes morning calls
   *    Created: November 10, 2025
   */
  static formatMemories(memories: Memory[]): string {
    if (!memories || memories.length === 0) {
      return '';
    }

    const formattedParts: string[] = [];
    let displayIndex = 1;

    for (const mem of memories) {
      const memoryText = mem.memory;

      if (!memoryText) {
        continue;
      }

      // Build the memory entry
      const parts: string[] = [`${displayIndex}. ${memoryText}`];

      // Add created date if available
      if (mem.created_at) {
        const createdDate = new Date(mem.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        parts.push(`   Created: ${createdDate}`);
      }

      // Add updated date if different from created
      if (mem.updated_at && mem.updated_at !== mem.created_at) {
        const updatedDate = new Date(mem.updated_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        parts.push(`   Updated: ${updatedDate}`);
      }

      formattedParts.push(parts.join('\n'));
      displayIndex++;
    }

    if (formattedParts.length === 0) {
      return '';
    }

    return formattedParts.join('\n\n');
  }
}
