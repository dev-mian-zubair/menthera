import { useCallback, useEffect, useRef } from 'react';
import { useChatContext } from '@/providers/ChatProvider';
import { logger } from '@/lib/utils/logger';

export interface UseChatOptions {
  agentId?: string;
  autoLoad?: boolean;
}

export const useChat = (options: UseChatOptions = {}) => {
  const { autoLoad = true } = options;
  const context = useChatContext();

  // Use refs to avoid stale closures in callbacks with empty dependency arrays
  const sendMessageRef = useRef(context.sendMessage);
  const loadHistoryRef = useRef(context.loadHistory);
  const clearChatRef = useRef(context.clearChat);

  useEffect(() => {
    sendMessageRef.current = context.sendMessage;
    loadHistoryRef.current = context.loadHistory;
    clearChatRef.current = context.clearChat;
  }, [context.sendMessage, context.loadHistory, context.clearChat]);

  useEffect(() => {
    if (options.agentId && options.agentId !== context.agentId && autoLoad) {
      loadHistoryRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.agentId, autoLoad]);

  const send = useCallback(
    async (message: string) => {
      if (!message.trim()) {
        return false;
      }

      try {
        await sendMessageRef.current(message);
        return true;
      } catch (error) {
        logger.error('[useChat] Error sending message:', error);
        return false;
      }
    },
    []
  );

  const reload = useCallback(() => {
    loadHistoryRef.current();
  }, []);

  const clear = useCallback(async () => {
    await clearChatRef.current();
  }, []);

  return {
    messages: context.messages,
    isLoading: context.isLoading,
    isSending: context.isSending,
    isStreaming: context.isStreaming,
    error: context.error,
    typingIndicator: context.typingIndicator,
    agentId: context.agentId,
    hasMoreOlder: context.hasMoreOlder,
    isOnline: context.isOnline,
    retryCount: context.retryCount,
    searchQuery: context.searchQuery,
    filteredMessages: context.filteredMessages,
    send,
    reload,
    clear,
    clearError: context.clearError,
    setMessages: context.setMessages,
    addMessage: context.addMessage,
    updateMessage: context.updateMessage,
    removeMessage: context.removeMessage,
    loadMoreOlderMessages: context.loadMoreOlderMessages,
    refreshNewestMessages: context.refreshNewestMessages,
    retryLastFailedMessage: context.retryLastFailedMessage,
    searchMessages: context.searchMessages,
    clearSearch: context.clearSearch,
    sendWelcomeMessage: context.sendWelcomeMessage,
  };
};
