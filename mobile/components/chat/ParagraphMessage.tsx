import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Message, getMessageText } from '@/lib/types/message';
import { chatStyles } from '@/lib/styles/screens/tabs/chat.styles';
import { MarkdownText } from './MarkdownText';
import { BubbleTail } from './BubbleTail';
import { TimeTheme } from '@/lib/utils/time-theme';

interface ParagraphMessageProps {
  message: Message | { id: string; text: string; sender: 'user' | 'agent'; timestamp: Date };
  agentColors?: { primary: string; [key: string]: string };
  theme?: TimeTheme;
}

export const ParagraphMessage = React.memo(({ message, agentColors, theme }: ParagraphMessageProps) => {
  const isUser = 'role' in message ? message.role === 'user' : message.sender === 'user';
  const content = 'parts' in message ? getMessageText(message.parts) : ('text' in message ? message.text : '');
  const status = 'status' in message ? message.status : undefined;
  const isGroupEnd = (message as any).isGroupEnd;

  const paragraphs = useMemo(
    () =>
      content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => {
          // Filter out empty paragraphs and paragraphs with only special characters
          if (p.length === 0) return false;
          // Check if paragraph is only whitespace, dashes, or dots
          if (/^[\s\-\.\*•]+$/.test(p)) return false;
          return true;
        }),
    [content]
  );

  if (paragraphs.length <= 1) {
    return (
      <View
        style={[
          chatStyles.messages.messageContainer,
          isUser
            ? chatStyles.messages.messageContainerUser
            : chatStyles.messages.messageContainerAgent,
          { paddingHorizontal: 16 },
        ]}
      >
        <View style={chatStyles.messages.bubbleWrapper}>
          <View
            style={[
              chatStyles.messages.bubble,
              isUser
                ? [
                    chatStyles.messages.bubbleUser,
                    !isGroupEnd && chatStyles.messages.bubbleUserWithoutTail,
                    agentColors && {
                      backgroundColor: agentColors.primary,
                    },
                    status === 'sending' && { opacity: 0.7 },
                    status === 'error' && { borderColor: '#F44', borderWidth: 1 },
                  ]
                : [
                    chatStyles.messages.bubbleAgent,
                    !isGroupEnd && chatStyles.messages.bubbleAgentWithoutTail,
                    theme && { backgroundColor: theme.chat.agentBubble },
                  ],
            ]}
          >
            {isUser ? (
              <Text
                style={[
                  chatStyles.messages.messageText,
                  chatStyles.messages.messageTextUser,
                ]}
              >
                {content}
              </Text>
            ) : (
              <MarkdownText
                fontSize={18}
                fontFamily="SFProDisplayRegular"
                color={theme?.chat.agentText || '#000000'}
                lineHeight={24}
                themeColors={theme?.chat}
              >
                {content}
              </MarkdownText>
            )}
          </View>
          {isGroupEnd && <BubbleTail isUser={isUser} color={isUser ? agentColors?.primary : theme?.chat.agentBubble} />}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        chatStyles.messages.messageContainerAgent,
        { paddingHorizontal: 16 },
      ]}
    >
      {paragraphs.map((paragraph, index) => {
        const isLastParagraph = index === paragraphs.length - 1;
        return (
          <View
            key={`${message.id}-para-${index}`}
            style={[
              chatStyles.messages.messageContainerAgent,
              {
                flexDirection: 'row',
                paddingHorizontal: 0,
                marginBottom: isLastParagraph ? 0 : 4,
              },
            ]}
          >
            <View style={chatStyles.messages.bubbleWrapper}>
              <View
                style={[
                  {
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: theme?.chat.agentBubble || '#FFFFFF',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    borderBottomRightRadius: 16,
                  },
                  isLastParagraph
                    ? { borderBottomLeftRadius: 8 }
                    : { borderBottomLeftRadius: 16 },
                ]}
              >
                <MarkdownText
                  fontSize={18}
                  fontFamily="SFProDisplayRegular"
                  color={theme?.chat.agentText || '#000000'}
                  lineHeight={24}
                  themeColors={theme?.chat}
                >
                  {paragraph}
                </MarkdownText>
              </View>
              {isLastParagraph && <BubbleTail isUser={false} color={theme?.chat.agentBubble} />}
            </View>
          </View>
        );
      })}
    </View>
  );
});

ParagraphMessage.displayName = 'ParagraphMessage';
