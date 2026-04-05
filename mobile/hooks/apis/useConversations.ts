import { useState, useEffect, useCallback } from 'react';
import { conversationsApi } from '@/lib/api';
import { isApiSuccess } from '@/lib/api/config';
import { Conversation, Message } from '@/lib/types';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await conversationsApi.getConversations();

      if (isApiSuccess(response)) {
        setConversations(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const refetch = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refetch,
  };
};

export const useConversation = (agentId: string) => {
  const { conversations } = useConversations();

  const conversation = conversations.find(c => c.agentId === agentId) || null;

  return {
    conversation,
  };
};

export const useMessages = (agentId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!agentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await conversationsApi.getMessages(agentId);

      if (isApiSuccess(response)) {
        setMessages(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const refetch = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    refetch,
  };
};

export const useSendMessage = () => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (agentId: string, content: string) => {
    setSending(true);
    setError(null);

    try {
      const response = await conversationsApi.sendMessage(agentId, content);

      if (isApiSuccess(response)) {
        return response.data;
      } else {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setSending(false);
    }
  }, []);

  return {
    sendMessage,
    sending,
    error,
  };
};

