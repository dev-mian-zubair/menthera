import React, {
  useCallback,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, Text, ScrollView } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { Message, getMessageText } from '@/lib/types/message';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ReportNotificationCard } from './ReportNotificationCard';
import { chatStyles } from '@/lib/styles/screens/tabs/chat.styles';
import { TimeTheme } from '@/lib/utils/time-theme';
import { logger } from '@/lib/utils/logger';

interface MessagesListProps {
  messages: Array<
    Message | { id: string; text?: string; sender?: 'user' | 'agent'; timestamp?: Date; [k: string]: any }
  >;
  isLoading: boolean;
  isLoadingOlder: boolean;
  isRefreshingNewest: boolean;
  hasMoreOlder: boolean;
  showTypingIndicator?: boolean;
  agentColors?: { primary: string; [key: string]: string };
  onLoadOlder: () => Promise<void>;
  onRefreshNewest: () => Promise<void>;
  onEndReached?: () => void;
  onMomentumScrollBegin?: () => void;
  theme?: TimeTheme;
}

export interface MessagesListRef {
  scrollToBottom: (animated?: boolean) => void;
}

// static content style
const flashListContentStyle = {
  paddingTop: 20,
  paddingBottom: 20,
};

const MessageSeparator = React.memo(() => <View style={{ height: 4 }} />);
MessageSeparator.displayName = 'MessageSeparator';

const arePropsEqual = (prevProps: MessagesListProps, nextProps: MessagesListProps): boolean => {
  if (prevProps.messages !== nextProps.messages) {
    return false;
  }

  if (
    prevProps.isLoading !== nextProps.isLoading ||
    prevProps.isLoadingOlder !== nextProps.isLoadingOlder ||
    prevProps.isRefreshingNewest !== nextProps.isRefreshingNewest ||
    prevProps.hasMoreOlder !== nextProps.hasMoreOlder ||
    prevProps.showTypingIndicator !== nextProps.showTypingIndicator
  ) {
    return false;
  }

  if (
    prevProps.onRefreshNewest !== nextProps.onRefreshNewest ||
    prevProps.onLoadOlder !== nextProps.onLoadOlder ||
    prevProps.onEndReached !== nextProps.onEndReached ||
    prevProps.onMomentumScrollBegin !== nextProps.onMomentumScrollBegin
  ) {
    return false;
  }

  if (prevProps.agentColors?.primary !== nextProps.agentColors?.primary) {
    return false;
  }

  if (prevProps.theme !== nextProps.theme) {
    return false;
  }

  return true;
};

export const MessagesList = React.memo(
  forwardRef<MessagesListRef, MessagesListProps>((props: MessagesListProps, ref: any) => {

    const {
      messages,
      isLoading,
      isLoadingOlder,
      isRefreshingNewest,
      hasMoreOlder,
      showTypingIndicator = false,
      agentColors,
      onLoadOlder,
      onRefreshNewest,
      onEndReached,
      onMomentumScrollBegin,
      theme,
    } = props;

    const handleOnRefresh = useCallback(async () => {
      await onRefreshNewest();
    }, [onRefreshNewest]);

    const flashListRef = useRef<FlashListRef<Record<string, unknown>>>(null);
    const firstVisibleMessageIdRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      scrollToBottom: (animated = true) => {
        try {
          if (flashListRef.current?.scrollToEnd) {
            flashListRef.current.scrollToEnd({ animated });
          }
        } catch (e) {
          logger.debug('[MessagesList] scrollToBottom failed:', e);
        }
      },
    }));

    const onViewableItemsChanged = useCallback(
      ({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems.length > 0) {
          const firstVisible = viewableItems.find((item) => !item.item?.isTypingIndicator);
          if (firstVisible) {
            firstVisibleMessageIdRef.current = firstVisible.item?.id;
          }
        }
      },
      []
    );

    const flattenedMessages = useMemo(() => {
      const flattened: any[] = [];

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const nextMessage = messages[i + 1];
        const content = 'parts' in message ? getMessageText(message.parts) : ((message as any).text || '');

        // Hide messages that start with "/" (command messages)
        if (content.trim().startsWith('/')) {
          continue;
        }

        const paragraphs = content
          .split(/\n\s*\n/)
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 0);

        const currentRole = 'role' in message ? message.role : (message as any).sender;
        const nextRole = nextMessage ? ('role' in nextMessage ? nextMessage.role : (nextMessage as any).sender) : null;
        const isLastOfGroup = !nextMessage || nextRole !== currentRole;

        if (paragraphs.length <= 1) {
          flattened.push({
            ...message,
            isGroupEnd: isLastOfGroup,
          });
        } else {
          paragraphs.forEach((paragraph: string, index: number) => {
            flattened.push({
              ...message,
              id: `${message.id}-para-${index}`,
              isParagraph: true,
              paragraphIndex: index,
              totalParagraphs: paragraphs.length,
              parts: [{ type: 'text' as const, text: paragraph }],
              isGroupStart: index === 0,
              isGroupEnd: index === paragraphs.length - 1 && isLastOfGroup,
            });
          });
        }
      }

      return flattened;
    }, [messages]);

    const messagesWithTyping = useMemo(
      () =>
        showTypingIndicator
          ? [...flattenedMessages, { id: 'typing-indicator', isTypingIndicator: true }]
          : flattenedMessages,
      [flattenedMessages, showTypingIndicator]
    );

    const renderMessage = useCallback(
      ({ item }: { item: any }) => {
        if (item?.isTypingIndicator) {
          return <TypingIndicator visible color={agentColors?.primary} />;
        }

        // Check if this is a report notification message
        if (item?.message_type === 'REPORT_NOTIFICATION') {
          return (
            <ReportNotificationCard
              messageId={item.id}
              agentId={item.agent_id || ''}
              questId={item.quest_id || ''}
              sessionId={item.session_id || ''}
              title={item.report_title || 'Report Ready'}
              shortDescription={item.report_description || 'Your report is ready to view'}
              icon={item.report_icon}
              timestamp={item.timestamp || new Date().toISOString()}
            />
          );
        }

        return <ChatMessage message={item} agentColors={agentColors} theme={theme} />;
      },
      [agentColors, theme]
    );

    const keyExtractor = useCallback((item: any) => item.id, []);

    const maintainMinIndex = useMemo(() => {
      if (!firstVisibleMessageIdRef.current) {
        return 0;
      }
      const index = messagesWithTyping.findIndex(
        (msg) => msg.id === firstVisibleMessageIdRef.current
      );
      return index >= 0 ? index : 0;
    }, [messagesWithTyping]);

    if (isLoading) {
      return (
        <ScrollView
          contentContainerStyle={chatStyles.messages.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {[1, 2].map((index) => (
            <View key={index} style={chatStyles.messages.skeletonContainer}>
              <View style={chatStyles.messages.skeletonBubbleUser} />
              <View style={chatStyles.messages.skeletonBubbleAgent} />
              <View style={[chatStyles.messages.skeletonBubbleAgent, {
                height: 102,
              }]} />
            </View>
          ))}
        </ScrollView>
      );
    }

    return (
      <FlashList
        ref={flashListRef}
        data={messagesWithTyping}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        contentContainerStyle={flashListContentStyle}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        onRefresh={handleOnRefresh}
        refreshing={isRefreshingNewest}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        onMomentumScrollBegin={onMomentumScrollBegin}
        ItemSeparatorComponent={MessageSeparator}
        ListHeaderComponent={
          isLoadingOlder && hasMoreOlder ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme?.chat.agentBubble || '#FFFFFF',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  borderTopWidth: 1,
                  borderLeftWidth: 1,
                  borderRightWidth: 2,
                  borderBottomWidth: 2,
                  borderColor: theme?.chat.inputBorder || '#E5E7EB',
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: agentColors?.primary || '#5A86FF',
                    borderTopColor: 'transparent',
                  }}
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontFamily: 'SFProDisplayMedium',
                    color: theme?.chat.agentTimestamp || '#8E8E93',
                  }}
                >
                  Loading older messages...
                </Text>
              </View>
            </View>
          ) : !hasMoreOlder && messages.length > 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'SFProDisplayRegular',
                  color: theme?.chat.agentTimestamp || '#C7C7CC',
                }}
              >
                No more messages
              </Text>
            </View>
          ) : null
        }
      />
    );
  }),
  arePropsEqual
);

MessagesList.displayName = 'MessagesList';
