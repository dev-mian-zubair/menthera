import React from 'react';
import { View, Text } from 'react-native';
import { Message, getMessageText, ReportNotificationMessage } from '@/lib/types/message';
import { chatStyles } from '@/lib/styles/screens/tabs/chat.styles';
import { ParagraphMessage } from './ParagraphMessage';
import { MarkdownText } from './MarkdownText';
import { BubbleTail } from './BubbleTail';
import { ReportNotificationCard } from './ReportNotificationCard';
import { TimeTheme } from '@/lib/utils/time-theme';

interface ChatMessageProps {
  message: Message | { id: string; text: string; sender: 'user' | 'agent'; timestamp: Date };
  agentColors?: { primary: string; [key: string]: string };
  theme?: TimeTheme;
}

export const ChatMessage = React.memo(({ message, agentColors, theme }: ChatMessageProps) => {
  // Check if this is a report notification message
  if ('message_type' in message && message.message_type === 'REPORT_NOTIFICATION') {
    const reportMessage = message as ReportNotificationMessage;
    return (
      <ReportNotificationCard
        messageId={reportMessage.id}
        agentId={reportMessage.agentId || '1'}
        questId={reportMessage.quest_id}
        sessionId={reportMessage.session_id}
        title={reportMessage.report_title}
        shortDescription={reportMessage.report_description}
        icon={reportMessage.report_icon}
        timestamp={reportMessage.createdAt?.toISOString() || new Date().toISOString()}
      />
    );
  }

  const isUser = 'role' in message ? message.role === 'user' : message.sender === 'user';
  const content = 'parts' in message ? getMessageText(message.parts) : ('text' in message ? message.text : '');
  const isParagraph = (message as any).isParagraph;
  const isGroupEnd = (message as any).isGroupEnd;

  // Filter out empty or special-character-only content
  const trimmedContent = content.trim();
  if (trimmedContent.length === 0 || /^[\s\-\.\*•]+$/.test(trimmedContent)) {
    return null;
  }

  if (isParagraph) {
    return (
      <View
        style={[
          chatStyles.messages.messageContainer,
          chatStyles.messages.messageContainerAgent,
          { paddingHorizontal: 16, marginBottom: 4 },
        ]}
      >
        <View style={chatStyles.messages.bubbleWrapper}>
          <View
            style={[
              chatStyles.messages.bubble,
              chatStyles.messages.bubbleAgent,
              !isGroupEnd && chatStyles.messages.bubbleAgentWithoutTail,
              theme && { backgroundColor: theme.chat.agentBubble },
            ]}
          >
            <MarkdownText
              fontSize={18}
              fontFamily="SFProDisplayRegular"
              color={theme?.chat.agentText || '#000000'}
              lineHeight={24}
              themeColors={theme?.chat}
            >
              {content}
            </MarkdownText>
          </View>
          {isGroupEnd && <BubbleTail isUser={false} color={theme?.chat.agentBubble} />}
        </View>
      </View>
    );
  }

  if (!isUser) {
    return <ParagraphMessage message={message} agentColors={agentColors} theme={theme} />;
  }

  const status = 'status' in message ? message.status : undefined;
  const error = 'error' in message ? message.error : undefined;

  return (
    <View
      style={[
        chatStyles.messages.messageContainer,
        chatStyles.messages.messageContainerUser,
        { paddingHorizontal: 16 },
      ]}
    >
      <View style={chatStyles.messages.bubbleWrapper}>
        <View
          style={[
            chatStyles.messages.bubble,
            chatStyles.messages.bubbleUser,
            chatStyles.messages.bubbleUserWithoutTail,
            agentColors && {
              backgroundColor: agentColors.primary,
            },
            status === 'error' && { borderColor: '#F44', borderWidth: 1 },
          ]}
        >
          <Text
            style={[
              chatStyles.messages.messageText,
              chatStyles.messages.messageTextUser,
            ]}
          >
            {content}
          </Text>
        </View>
        <BubbleTail isUser={true} color={agentColors?.primary} />
      </View>
    </View>
  );
});

ChatMessage.displayName = 'ChatMessage';
