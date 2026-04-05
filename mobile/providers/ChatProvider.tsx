/**
 * Chat Provider
 * Manages global chat state and message operations
 */
import React, { createContext, useContext, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { AppState } from 'react-native';
import { Message, ChatState, ChatRequest, createTextMessage, getMessageText } from '@/lib/types/message';
import { API_CONFIG } from '@/lib/api/config';
import { recordMetric, logPerformanceSummary } from '@/lib/utils/performance';
import { logger } from '@/lib/utils/logger';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useAgentPreferencesContext } from './AgentPreferencesProvider';

/**
 * Transform raw message data from API to Message type
 * Preserves special fields like message_type for REPORT_NOTIFICATION messages
 */
function transformMessageFromApi(
  msg: any,
  agentId: string,
  userId: string | null,
  fallbackId?: string
): Message {
  return {
    id: msg.message_id || msg.id || fallbackId || `msg_${Date.now()}`,
    role: msg.role as 'user' | 'assistant',
    parts: createTextMessage(msg.content || ''),
    createdAt: new Date(msg.timestamp || msg.created_at || Date.now()),
    agentId,
    userId: userId || undefined,
    status: 'sent' as const,
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
}

interface ChatContextType {
  // State
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  isStreaming: boolean;
  error: string | null;
  typingIndicator: boolean;
  agentId: string | null;
  hasMoreOlder: boolean;
  isOnline: boolean;
  retryCount: number;
  searchQuery: string;
  filteredMessages: Message[];

  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  refreshNewestMessages: () => Promise<void>;
  loadMoreOlderMessages: () => Promise<void>;
  clearChat: () => Promise<void>;
  clearError: () => void;
  retryLastFailedMessage: () => Promise<void>;
  searchMessages: (query: string) => void;
  clearSearch: () => void;
  sendWelcomeMessage: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // Get authenticated user from Clerk
  const { user } = useUser();
  const userId = user?.id || 'user_placeholder';

  // Get authenticated fetch function (calls getToken() at request time within proper React context)
  const authenticatedFetch = useAuthenticatedFetch();

  // Get selected agent from preferences (global state)
  const { selectedAgentId: agentId } = useAgentPreferencesContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const MESSAGES_PER_PAGE = 20;
  const MAX_RETRIES = 3;
  const MAX_MESSAGES_IN_MEMORY = 500;

  // Track failed message for retry
  const lastFailedMessageRef = useRef<{ content: string; agentId: string } | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Refs to capture current agentId, userId, and currentOffset without triggering dependency changes
  const agentIdRef = useRef(agentId);
  const userIdRef = useRef(userId);
  const currentOffsetRef = useRef(currentOffset);
  const hasMoreOlderRef = useRef(hasMoreOlder);
  const messagesRef = useRef(messages);

  // Update refs whenever values change
  useEffect(() => {
    agentIdRef.current = agentId;
    userIdRef.current = userId;
    currentOffsetRef.current = currentOffset;
    hasMoreOlderRef.current = hasMoreOlder;
    messagesRef.current = messages;

    logger.debug('[ChatProvider] State updated:', {
      agentId,
      userId,
      messagesCount: messages.length,
      currentOffset,
      hasMoreOlder,
    });
  }, [agentId, userId, currentOffset, hasMoreOlder, messages]);

  /**
   * Add message to chat
   */
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      const newMessages = [...prev, message];
      // Sort by createdAt timestamp to maintain chronological order
      // If timestamps are equal, maintain insertion order by comparing IDs
      return newMessages.sort((a, b) => {
        const timeA = a.createdAt?.getTime() || 0;
        const timeB = b.createdAt?.getTime() || 0;
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        // Secondary sort by ID to ensure stable ordering
        return a.id.localeCompare(b.id);
      });
    });
  }, []);

  /**
   * Update message in chat
   */
  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  /**
   * Remove message from chat
   */
  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const loadHistory = useCallback(async () => {
    const currentAgentId = agentIdRef.current;
    const currentUserId = userIdRef.current;

    if (!currentAgentId) {
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || API_CONFIG.BASE_URL;
      const url = `${baseUrl}/messages/${currentAgentId}?limit=${MESSAGES_PER_PAGE}&offset=0`;

      const response = await authenticatedFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load history: ${response.status}`);
      }

      const data = await response.json();

      // Extract messages from various response formats
      let messagesArray: any[] = [];
      if (data.data?.messages) {
        messagesArray = data.data.messages;
      } else if (data.messages) {
        messagesArray = data.messages;
      } else if (Array.isArray(data)) {
        messagesArray = data;
      }

      // Transform API messages to Message type
      const historyMessages: Message[] = messagesArray.map((msg: any, idx: number) =>
        transformMessageFromApi(msg, currentAgentId, currentUserId, `msg_${idx}`)
      );

      // Sort messages by createdAt timestamp with stable secondary sort
      const sortedMessages = historyMessages.sort((a, b) => {
        const timeA = a.createdAt?.getTime() || 0;
        const timeB = b.createdAt?.getTime() || 0;
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        return a.id.localeCompare(b.id);
      });

      setMessages(sortedMessages);
      setCurrentOffset(0);
      setHasMoreOlder(historyMessages.length >= MESSAGES_PER_PAGE);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load history';
      logger.error('[ChatProvider] Error loading history:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch]);

  const refreshNewestMessages = useCallback(async () => {
    // Pagination handled by chat.tsx loadOlderMessages
  }, []);

  const loadMoreOlderMessages = useCallback(async () => {
    const currentAgentId = agentIdRef.current;
    const currentUserId = userIdRef.current;
    const currentHasMoreOlder = hasMoreOlderRef.current;
    const newOffset = currentOffsetRef.current + MESSAGES_PER_PAGE;

    if (!currentAgentId || !currentHasMoreOlder) {
      return;
    }

    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || API_CONFIG.BASE_URL;
      const url = `${baseUrl}/messages/${currentAgentId}?limit=${MESSAGES_PER_PAGE}&offset=${newOffset}`;

      const response = await authenticatedFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load more messages: ${response.status}`);
      }

      const data = await response.json();

      // Extract messages from various response formats
      let newMessages: any[] = [];
      if (data.data?.messages) {
        newMessages = data.data.messages;
      } else if (data.messages) {
        newMessages = data.messages;
      } else if (Array.isArray(data)) {
        newMessages = data;
      }

      if (newMessages.length < MESSAGES_PER_PAGE) {
        setHasMoreOlder(false);
      }

      setCurrentOffset(newOffset);

      // Transform API messages to Message type
      const olderMessages = newMessages.map((msg: any, idx: number) =>
        transformMessageFromApi(msg, currentAgentId, currentUserId, `msg_older_${idx}`)
      );

      setMessages((prev) => {
        const combined = [...olderMessages, ...prev];
        // Sort to maintain chronological order
        return combined.sort((a, b) => {
          const timeA = a.createdAt?.getTime() || 0;
          const timeB = b.createdAt?.getTime() || 0;
          if (timeA !== timeB) {
            return timeA - timeB;
          }
          return a.id.localeCompare(b.id);
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more messages';
      logger.error('[ChatProvider] Error loading more messages:', errorMessage);
      setError(errorMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Helper method to process streaming AI responses (v5 UI Message stream format)
   * Handles both streaming (response.body) and non-streaming responses
   * @param response - The fetch response object
   * @param assistantMessageId - The ID of the assistant message to update
   * @param logPrefix - Prefix for console logs (e.g., "ChatProvider", "Welcome")
   */
  const processStreamingResponse = useCallback(
    async (response: Response, assistantMessageId: string, logPrefix: string = 'ChatProvider') => {
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let chunkCount = 0;

        logger.debug(`[${logPrefix}] Starting to read v5 UI Message stream...`);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              logger.debug(`[${logPrefix}] Stream done, total chunks:`, chunkCount);
              break;
            }

            chunkCount++;
            const text = decoder.decode(value, { stream: true });

            if (chunkCount <= 3) {
              logger.debug(`[${logPrefix}] Chunk ${chunkCount} raw:`, text.substring(0, 200));
            }

            const lines = text.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;

              // v5 UI Message stream format: SSE with "data:" prefix
              if (trimmed.startsWith('data:')) {
                try {
                  const jsonStr = trimmed.substring(5).trim(); // Remove "data:" prefix
                  const chunk = JSON.parse(jsonStr);

                  if (chunkCount <= 3) {
                    logger.debug(`[${logPrefix}] Parsed chunk:`, chunk);
                  }

                  // Handle text-delta chunks (streaming text content)
                  if (chunk.type === 'text-delta' && chunk.delta) {
                    accumulatedContent += chunk.delta;
                    updateMessage(assistantMessageId, { parts: createTextMessage(accumulatedContent) });
                  }
                  // Handle text-end (final text chunk)
                  else if (chunk.type === 'text-end') {
                    logger.debug(`[${logPrefix}] Text stream ended, final length:`, accumulatedContent.length);
                  }
                  // Handle errors
                  else if (chunk.type === 'error') {
                    logger.error(`[${logPrefix}] Stream error:`, chunk.errorText);
                    throw new Error(chunk.errorText || 'Stream error');
                  }
                } catch (e) {
                  logger.warn(`[${logPrefix}] Failed to parse stream line:`, trimmed, e);
                }
              }
            }
          }
          logger.debug(`[${logPrefix}] Final accumulated content length:`, accumulatedContent.length);
        } finally {
          reader.releaseLock();
        }
      } else {
        logger.debug(`[${logPrefix}] No response.body, reading full response text`);
        const text = await response.text();

        let accumulatedContent = '';
        const lines = text.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          // v5 UI Message stream format: SSE with "data:" prefix
          if (trimmed.startsWith('data:')) {
            try {
              const jsonStr = trimmed.substring(5).trim();
              const chunk = JSON.parse(jsonStr);

              // Accumulate text-delta chunks
              if (chunk.type === 'text-delta' && chunk.delta) {
                accumulatedContent += chunk.delta;
              }
            } catch (e) {
              logger.warn(`[${logPrefix}] Failed to parse text line:`, trimmed, e);
            }
          }
        }

        if (accumulatedContent) {
          updateMessage(assistantMessageId, { parts: createTextMessage(accumulatedContent) });
        }
      }
    },
    [updateMessage]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const currentAgentId = agentIdRef.current;
      const currentUserId = userIdRef.current;

      if (!currentAgentId) {
        setError('No agent selected');
        return;
      }

      if (!content.trim()) {
        setError('Message cannot be empty');
        return;
      }

      // Create user message in v5 format
      const userTimestamp = Date.now();
      const userMessage: Message = {
        id: `msg_${userTimestamp}`,
        role: 'user',
        parts: createTextMessage(content.trim()),
        createdAt: new Date(userTimestamp),
        agentId: currentAgentId,
        userId: currentUserId,
        status: 'sending',
      };

      setTypingIndicator(true);
      setError(null);

      try {
        addMessage(userMessage);

        // Ensure assistant message has a later timestamp to maintain order
        const assistantTimestamp = userTimestamp + 1;
        const assistantMessageId = `msg_ai_${assistantTimestamp}`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          parts: createTextMessage(''),
          createdAt: new Date(assistantTimestamp),
          agentId: currentAgentId,
          userId: currentUserId,
          status: 'sending',
        };

        const streamUrl = `${API_CONFIG.CHAT_URL}message/${currentAgentId}`;
        const payload = {
          messages: [
            ...messagesRef.current
              .filter((m) => m.role !== 'user')
              .slice(-19)
              .map((m) => ({
                id: m.id,
                role: m.role,
                parts: m.parts
              })),
            {
              id: userMessage.id,
              role: 'user' as const,
              parts: createTextMessage(content.trim())
            },
          ],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        // Use authenticatedFetch which handles token injection internally
        const response = await authenticatedFetch(streamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify(payload),
        });

        logger.debug('[ChatProvider] Response received:', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (!response.ok) {
          // Try to read error message from response body
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          let rawBody = null;

          try {
            const contentType = response.headers.get('content-type');
            logger.debug('[ChatProvider] Error response content-type:', contentType);

            // Clone response to read body multiple times if needed
            const responseClone = response.clone();

            // First, try to read as text to see raw response
            try {
              rawBody = await responseClone.text();
              logger.debug('[ChatProvider] Raw error response body:', rawBody);
              logger.debug('[ChatProvider] Raw body length:', rawBody?.length);
            } catch (err) {
              logger.error('[ChatProvider] Failed to read raw body:', err);
            }

            // Now try to parse as JSON
            if (contentType && contentType.includes('application/json')) {
              try {
                const errorBody = await response.json();
                logger.debug('[ChatProvider] Parsed error JSON:', JSON.stringify(errorBody, null, 2));
                // Backend can return error in either 'message' or 'error' field
                if (errorBody?.message) {
                  errorMessage = errorBody.message;
                  logger.debug('[ChatProvider] Using error message from body.message:', errorMessage);
                } else if (errorBody?.error) {
                  errorMessage = errorBody.error;
                  logger.debug('[ChatProvider] Using error message from body.error:', errorMessage);
                }
              } catch (jsonErr) {
                logger.error('[ChatProvider] Failed to parse JSON:', jsonErr);
                // Use raw text if JSON parsing fails
                if (rawBody) {
                  errorMessage = rawBody;
                }
              }
            } else if (rawBody) {
              // Not JSON, use raw text
              errorMessage = rawBody;
              logger.debug('[ChatProvider] Using raw text as error message');
            }
          } catch (e) {
            logger.error('[ChatProvider] Failed to process error response:', e);
          }

          logger.debug('[ChatProvider] Final error message:', errorMessage);
          throw new Error(errorMessage);
        }

        addMessage(assistantMessage);

        // Process the streaming response
        await processStreamingResponse(response, assistantMessageId, 'ChatProvider');

        updateMessage(userMessage.id, { status: 'sent' });
        updateMessage(assistantMessageId, { status: 'sent' });
        recordMetric('sendMessage', Date.now(), { agentId: currentAgentId, messageLength: content.length });
        lastFailedMessageRef.current = null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        logger.error('[ChatProvider] Error sending message:', errorMessage);
        setError(errorMessage);
        updateMessage(userMessage.id, { status: 'error', error: errorMessage });
        lastFailedMessageRef.current = { content, agentId: currentAgentId };
      } finally {
        setTypingIndicator(false);
      }
    },
    [addMessage, updateMessage, authenticatedFetch, processStreamingResponse]
  );

  const clearChat = useCallback(async () => {
    setMessages([]);
    setCurrentOffset(0);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retryLastFailedMessage = useCallback(async () => {
    if (!lastFailedMessageRef.current) {
      return;
    }

    const { content } = lastFailedMessageRef.current;
    setRetryCount((prevCount) => {
      if (prevCount < MAX_RETRIES) {
        sendMessage(content);
        return prevCount + 1;
      } else {
        setError('Max retries exceeded. Please try again later.');
        return prevCount;
      }
    });
  }, [sendMessage]);

  const searchMessages = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  /**
   * Welcome Message Method
   */
  const sendWelcomeMessage = useCallback(async () => {
    const currentAgentId = agentIdRef.current;

    if (!currentAgentId) {
      logger.warn('[ChatProvider] Cannot send welcome message: No agent selected');
      return;
    }

    try {
      logger.debug('[ChatProvider] Sending welcome message for agent:', currentAgentId);

      // Get the message URL (Lambda Function URL from env) - same as regular messages
      const messageUrl = process.env.EXPO_PUBLIC_CHAT_URL || API_CONFIG.CHAT_URL;
      const url = `${messageUrl}message/${currentAgentId}/welcome`;

      logger.debug('[ChatProvider] Fetching welcome from:', url);

      const response = await authenticatedFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch welcome message: ${response.status}`);
      }

      // Process the streamed response (same logic as sendMessage)
      setTypingIndicator(true);

      const assistantMessageId = `msg_${Date.now()}_assistant`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        parts: createTextMessage(''),
        createdAt: new Date(),
        agentId: currentAgentId,
        userId: userIdRef.current,
        status: 'sending',
      };

      addMessage(assistantMessage);

      // Process the streaming response using helper
      await processStreamingResponse(response, assistantMessageId, 'Welcome');

      updateMessage(assistantMessageId, { status: 'sent' });
      logger.debug('[ChatProvider] Welcome message completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send welcome message';
      logger.error('[ChatProvider] Error sending welcome message:', errorMessage);
      // Don't block user if welcome fails
    } finally {
      setTypingIndicator(false);
    }
  }, [authenticatedFetch, addMessage, updateMessage, processStreamingResponse]);

  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery) {
      return messages;
    }

    return messages.filter(
      (msg) =>
        getMessageText(msg.parts).toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  // Monitor app state for connection
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      appStateRef.current = state;
      setIsOnline(state === 'active');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Load history when agent changes
  // Track previous agentId to detect changes
  const previousAgentIdRef = useRef<string | null>(null);
  const isLoadingHistoryRef = useRef(false);

  useEffect(() => {
    logger.debug('[ChatProvider] Agent changed useEffect triggered', {
      agentId,
      previousAgentId: previousAgentIdRef.current,
      hasAgentId: !!agentId,
      userId,
      isSignedIn: !!user,
      currentMessages: messages.length,
      isLoadingHistory: isLoadingHistoryRef.current,
    });

    // Only load history if:
    // 1. User is signed in
    // 2. Agent ID exists and actually changed
    // 3. Not already loading history
    if (user && agentId && agentId !== previousAgentIdRef.current && !isLoadingHistoryRef.current) {
      logger.debug('[ChatProvider] Agent changed and user signed in, loading history for:', agentId);
      previousAgentIdRef.current = agentId;
      isLoadingHistoryRef.current = true;

      // Clear state immediately and load history
      setMessages([]);
      setCurrentOffset(0);
      setHasMoreOlder(false);

      // Load history for the new agent
      loadHistory().finally(() => {
        isLoadingHistoryRef.current = false;
      });
    } else if (!user) {
      logger.debug('[ChatProvider] User not signed in, skipping history load');
    } else if (agentId && agentId === previousAgentIdRef.current) {
      logger.debug('[ChatProvider] Same agent, skipping history reload');
    }
  }, [agentId, user?.id, loadHistory]); // Depend on user.id (stable) instead of entire user object

  // Note: AI messages are now managed directly in sendMessage function

  const value: ChatContextType = useMemo(
    () => ({
      messages,
      isLoading,
      isSending: typingIndicator,
      isStreaming: typingIndicator,
      error,
      typingIndicator,
      agentId,
      hasMoreOlder,
      isOnline,
      retryCount,
      searchQuery,
      filteredMessages,
      setMessages,
      addMessage,
      updateMessage,
      removeMessage,
      sendMessage,
      loadHistory,
      refreshNewestMessages,
      loadMoreOlderMessages,
      clearChat,
      clearError,
      retryLastFailedMessage,
      searchMessages,
      clearSearch,
      sendWelcomeMessage,
    }),
    [
      messages,
      isLoading,
      error,
      typingIndicator,
      agentId,
      hasMoreOlder,
      isOnline,
      retryCount,
      searchQuery,
      filteredMessages,
      // Don't include callbacks in dependency array - they're stable/memoized
      // addMessage, updateMessage, removeMessage, sendMessage are already useCallback wrapped
      // and don't need to be in this array to change the context value
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

/**
 * Hook to use the Chat context
 */
export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};
