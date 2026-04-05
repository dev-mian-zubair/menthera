import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';

import { useAgentsState, useAgentsActions } from '@/providers';
import { useAgentPreferencesContext } from '@/providers/AgentPreferencesProvider';
import { useChat } from '@/hooks/useChat';
import { useStartCall } from '@/hooks/useStartCall';
import { useApiKeyGate } from '@/hooks/useApiKeyGate';
import { ApiKeyPrompt } from '@/components/modals/ApiKeyPrompt';
import { chatStyles } from '@/lib/styles/screens/tabs/chat.styles';
import { ROUTES } from '@/lib/routes';
import { MessagesList } from '@/components/chat/MessagesList';
import { ChatInputArea } from '@/components/chat/ChatInputArea';
import { ConnectionStatus } from '@/components/chat/ConnectionStatus';
import { AgentSelectionModal } from '@/components/chat/AgentSelectionModal';
import { SafeGuardModal } from '@/components/chat/SafeGuardModal';
import { Avatar } from '@/components/common/Avatar';
import { getTimeTheme } from '@/lib/utils/time-theme';
import ShieldSvg from '@/assets/svgs/shield.svg';
import PeopleSvg from '@/assets/svgs/people.svg';
import CallSvg from '@/assets/svgs/call.svg';
import BackSvg from '@/assets/svgs/back.svg';
import { logger } from '@/lib/utils/logger';

export default function TalkScreen() {
  const { agents } = useAgentsState();
  const { fetchAgents } = useAgentsActions();
  const { selectedAgentId, selectAgent } = useAgentPreferencesContext();
  const params = useLocalSearchParams<{ agentId?: string; onboardingComplete?: string; welcomeMessage?: string }>();
  const { user } = useUser();
  const { startCall } = useStartCall();
  const { showPrompt, requireApiKey, dismissPrompt, onKeyStored } = useApiKeyGate();
  const insets = useSafeAreaInsets();
  const theme = useMemo(() => getTimeTheme(), []);

  const {
    messages,
    isLoading: isLoadingMessages,
    error: chatError,
    typingIndicator,
    hasMoreOlder,
    isOnline,
    retryCount,
    agentId: contextAgentId,
    send,
    reload: loadHistory,
    loadMoreOlderMessages,
    clearError,
    retryLastFailedMessage,
    sendWelcomeMessage,
  } = useChat();

  // Derive selected agent from global selectedAgentId
  const selectedAgent = useMemo(() => {
    return agents?.find(a => a.id === selectedAgentId) || null;
  }, [agents, selectedAgentId]);

  const [message, setMessage] = useState('');
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showSafeGuardModal, setShowSafeGuardModal] = useState(false);
  const [isRefreshingNewest, setIsRefreshingNewest] = useState(false);
  const [questStatus, setQuestStatus] = useState<'none' | 'completed' | 'available'>('none');
  const onStartReachedDuringMomentum = useRef(false);

  const messagesListRef = useRef<any>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const lastMessageContentLengthRef = useRef<number>(0);
  const initialScrollDoneRef = useRef(false);
  const isLoadingOlderRef = useRef(false);
  const hasMoreOlderRef = useRef(false);
  const isLoadingOlderPropsRef = useRef({ isLoadingOlder: false });
  const welcomeMessageSentRef = useRef(false);

  // Send welcome message after quest completion
  useEffect(() => {
    const shouldSendWelcome =
      params.welcomeMessage?.startsWith('/quest-welcome:') &&
      contextAgentId &&
      !isLoadingMessages &&
      !welcomeMessageSentRef.current;

    if (shouldSendWelcome && params.welcomeMessage) {
      logger.debug('[ChatScreen] Sending quest welcome command:', params.welcomeMessage);
      welcomeMessageSentRef.current = true;
      // Send the quest welcome command as a regular message
      // The backend will detect the /quest-welcome:{sessionId} pattern and generate a personalized welcome
      send(params.welcomeMessage);
    }
  }, [params.welcomeMessage, contextAgentId, isLoadingMessages, send]);

  // Initialize with first agent if no agent selected yet
  useEffect(() => {
    if (!selectedAgentId && agents && agents.length > 0) {
      const agentToSelect = agents[0];
      logger.debug('[ChatScreen] Initializing with first agent:', agentToSelect.name);
      selectAgent(agentToSelect.id);
    }
  }, [selectedAgentId, agents, selectAgent]);

  useEffect(() => {
    hasMoreOlderRef.current = hasMoreOlder;
  }, [hasMoreOlder]);

  // Initial scroll when messages first load for an agent
  useEffect(() => {
    if (
      messages.length > 0 &&
      !isLoadingMessages &&
      !isLoadingOlderRef.current &&
      !initialScrollDoneRef.current
    ) {
      logger.debug('[ChatScreen] Initial scroll - messages loaded');
      initialScrollDoneRef.current = true;
      const lastMessage = messages[messages.length - 1];
      lastMessageIdRef.current = lastMessage?.id ?? null;

      // Initialize content length ref
      if (lastMessage && 'parts' in lastMessage && Array.isArray(lastMessage.parts)) {
        lastMessageContentLengthRef.current = lastMessage.parts
          .filter((part: any) => part.type === 'text')
          .reduce((sum: number, part: any) => sum + (part.text?.length || 0), 0);
      }

      const timer = setTimeout(() => {
        messagesListRef.current?.scrollToBottom?.(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isLoadingMessages]);

  // Reset scroll flag when agent changes
  useEffect(() => {
    if (contextAgentId) {
      logger.debug('[ChatScreen] Agent changed, resetting scroll flag');
      initialScrollDoneRef.current = false;
    }
  }, [contextAgentId]);

  // Sync selectedAgent with contextAgentId to keep UI in sync
  useEffect(() => {
    if (contextAgentId && agents && agents.length > 0) {
      const agent = agents.find(a => a.id === contextAgentId);

      if (agent && agent.id !== selectedAgent?.id) {
        logger.debug('[ChatScreen] Syncing selectedAgent with contextAgentId:', {
          contextAgentId,
          agentName: agent.name,
          previousSelectedAgent: selectedAgent?.name,
        });
        selectAgent(agent.id);
      }
    }
  }, [contextAgentId, agents, selectedAgent?.id]);

  useEffect(() => {
    if (messages.length === 0 || isLoadingOlderRef.current) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const currentLastMessageId = lastMessage?.id;

    // Calculate content length for streaming detection
    let currentContentLength = 0;
    if (lastMessage) {
      // For v5 messages with parts array
      if ('parts' in lastMessage && Array.isArray(lastMessage.parts)) {
        currentContentLength = lastMessage.parts
          .filter((part: any) => part.type === 'text')
          .reduce((sum: number, part: any) => sum + (part.text?.length || 0), 0);
      }
      // For legacy messages with text field
      else if ('text' in lastMessage && typeof lastMessage.text === 'string') {
        currentContentLength = lastMessage.text.length;
      }
    }

    // Trigger scroll if: new message OR content length changed (streaming updates)
    const isNewMessage = currentLastMessageId && lastMessageIdRef.current !== currentLastMessageId;
    const isContentUpdated = currentContentLength > 0 && currentContentLength !== lastMessageContentLengthRef.current;

    if (isNewMessage || isContentUpdated) {
      lastMessageIdRef.current = currentLastMessageId;
      lastMessageContentLengthRef.current = currentContentLength;

      const timer = setTimeout(() => {
        messagesListRef.current?.scrollToBottom?.(true);
      }, 50); // Reduced from 100ms to 50ms for more responsive scrolling during streaming
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const handleAgentSwitch = (agent: any) => {
    logger.debug('[ChatScreen] Manual agent switch to:', {
      agentId: agent.id,
      agentName: agent.name,
    });

    // Update global selected agent
    selectAgent(agent.id);
    setShowAgentModal(false);

    // ChatProvider will handle clearing messages and loading history
    initialScrollDoneRef.current = false;
  };

  const handleSend = useCallback(async () => {
    if (message.trim()) {
      requireApiKey(() => {
        const messageText = message.trim();
        setMessage('');
        send(messageText);
      });
    }
  }, [message, send, requireApiKey]);

  const handleMicPress = async () => {
    // TODO: Implement voice input
  };

  const handleCallPress = async () => {
    if (selectedAgent) {
      requireApiKey(() => {
        startCall(selectedAgent.id);
      });
    }
  };

  const handleBadgePress = async () => {
    if (selectedAgent) {
      const isCompleted = selectedAgent.personalization?.status === 'completed';
      const isReportReady = selectedAgent.personalization?.reportReady === true;

      if (isCompleted && isReportReady) {
        logger.debug('[ChatScreen] Quest completed with report ready, navigating to quest report');
        router.push(ROUTES.QUEST_REPORT(selectedAgent.id));
      }
    }
  };

  // Check quest status for selected agent from API data
  useEffect(() => {
    if (selectedAgent?.id) {
      const status = selectedAgent.personalization?.status || 'not_started';
      // Map quest status to badge status: 'not_started' | 'in_progress' -> 'available', 'completed' -> 'completed'
      setQuestStatus(status === 'completed' ? 'completed' : (status === 'not_started' ? 'none' : 'available'));
    }
  }, [selectedAgent?.id, selectedAgent?.personalization?.status]);

  const onMomentumScrollBegin = useCallback(() => {
    onStartReachedDuringMomentum.current = false;
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (onStartReachedDuringMomentum.current) return;
    if (isLoadingOlderRef.current || !hasMoreOlderRef.current) return;

    isLoadingOlderRef.current = true;
    isLoadingOlderPropsRef.current.isLoadingOlder = true;

    try {
      onStartReachedDuringMomentum.current = true;
      await loadMoreOlderMessages();
    } catch (error) {
      logger.error('[chat.tsx] Failed to load more messages:', error);
    } finally {
      isLoadingOlderRef.current = false;
      isLoadingOlderPropsRef.current.isLoadingOlder = false;
      onStartReachedDuringMomentum.current = false;
    }
  }, [loadMoreOlderMessages]);

  const handleRefreshNewest = useCallback(async () => {
    try {
      await loadOlderMessages();
    } catch (error) {
      logger.error('[chat.tsx] Failed to refresh messages:', error);
    }
  }, [loadOlderMessages]);

  const handleEndReached = useCallback(() => {
    // No-op: pagination handled by pull-to-refresh
  }, []);

  return (
    <View style={[chatStyles.container, { backgroundColor: theme.chat.background }]}>
      <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[chatStyles.header.container, { backgroundColor: theme.chat.headerBackground, paddingTop: insets.top + 12 }]}>
          {/* Left section: Back + Avatar + Name/Specialty */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={chatStyles.header.backButton}
            >
              <BackSvg width={24} height={24} color={theme.chat.headerIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              onPress={() => selectedAgent && router.push(ROUTES.AGENT(selectedAgent.id))}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={{ marginRight: 12 }}>
                {selectedAgent?.avatar && (
                  <Avatar
                    avatar={selectedAgent.avatar}
                    size={44}
                  />
                )}
              </View>

              {/* Name & Specialty aligned horizontally */}
              <View style={{ flex: 1 }}>
                <Text style={[chatStyles.header.agentName, { color: theme.chat.headerTitle, textAlign: 'left' }]} numberOfLines={1}>
                  {selectedAgent?.name || 'Coach'}
                </Text>
                <Text style={[chatStyles.header.agentSpecialty, { color: theme.chat.headerSubtitle, textAlign: 'left', marginTop: 2 }]} numberOfLines={1}>
                  {selectedAgent?.specialties?.[0] || 'AI Coach'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Right actions */}
          <View style={chatStyles.header.rightActions}>
            <TouchableOpacity
              style={chatStyles.header.iconButton}
              onPress={() => setShowSafeGuardModal(true)}
            >
              <ShieldSvg width={20} height={20} color={theme.chat.headerIcon}/>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAgentModal(true)}
              style={chatStyles.header.iconButton}
            >
              <PeopleSvg width={20} height={20} color={theme.chat.headerIcon}/>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCallPress}
              style={chatStyles.header.iconButton}
            >
              <CallSvg width={20} height={20} color={theme.chat.headerIcon}/>
            </TouchableOpacity>
          </View>
        </View>

          <ConnectionStatus
            isOnline={isOnline}
            retryCount={retryCount}
            onRetry={retryLastFailedMessage}
          />

          {chatError && (
            <View
              style={{
                backgroundColor: '#FEE',
                borderBottomWidth: 1,
                borderBottomColor: '#F44',
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 16,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text
                  style={{
                    flex: 1,
                    marginRight: 12,
                    color: '#C33',
                    fontSize: 13,
                    fontFamily: 'SFProDisplayRegular',
                    lineHeight: 18,
                  }}
                >
                  {chatError}
                </Text>
                <TouchableOpacity
                  onPress={clearError}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close" size={18} color="#C33" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Messages Area */}
          <View style={{ flex: 1, backgroundColor: theme.chat.background }}>
            <MessagesList
              ref={messagesListRef}
              messages={messages}
              isLoading={isLoadingMessages}
              isLoadingOlder={isLoadingOlderPropsRef.current.isLoadingOlder}
              isRefreshingNewest={isRefreshingNewest}
              hasMoreOlder={hasMoreOlder}
              showTypingIndicator={typingIndicator}
              agentColors={selectedAgent?.colors}
              onLoadOlder={loadOlderMessages}
              onRefreshNewest={handleRefreshNewest}
              onEndReached={handleEndReached}
              onMomentumScrollBegin={onMomentumScrollBegin}
              theme={theme}
            />
          </View>

          {/* Input Area */}
          <ChatInputArea
            value={message}
            onChangeText={setMessage}
            onSend={handleSend}
            onMicPress={handleMicPress}
            agentColor={selectedAgent?.colors?.primary}
            isLoading={isLoadingMessages}
            theme={theme}
          />
        </KeyboardAvoidingView>

      <AgentSelectionModal
        isVisible={showAgentModal}
        agents={agents}
        selectedAgent={selectedAgent}
        onAgentSelect={handleAgentSwitch}
        onClose={() => setShowAgentModal(false)}
        onRefresh={fetchAgents}
        theme={theme}
      />

      <SafeGuardModal
        isVisible={showSafeGuardModal}
        onClose={() => setShowSafeGuardModal(false)}
        theme={theme}
      />

      <ApiKeyPrompt
        visible={showPrompt}
        onSuccess={onKeyStored}
        onDismiss={dismissPrompt}
      />

    </View>
  );
}
