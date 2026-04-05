import React, { useMemo } from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatStyles } from '@/lib/styles/screens/tabs/chat.styles';
import { TimeTheme } from '@/lib/utils/time-theme';
import SendSvg from '@/assets/svgs/send.svg';

interface ChatInputAreaProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onMicPress: () => void;
  agentColor?: string;
  isLoading?: boolean;
  theme?: TimeTheme;
}

/**
 * ChatInputArea Component
 * Renders text input with send/mic button
 */
export const ChatInputArea = React.memo(({
  value,
  onChangeText,
  onSend,
  onMicPress,
  agentColor,
  isLoading = false,
  theme,
}: ChatInputAreaProps) => {
  const insets = useSafeAreaInsets();

  // Determine if we should show send icon (text is not empty)
  const showSendIcon = useMemo(() => value.trim().length > 0, [value]);

  const handleActionPress = () => {
    if (showSendIcon) {
      onSend();
    } else {
      onMicPress();
    }
  };

  return (
    <View
      style={[
        chatStyles.input.container,
        {
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 12 : 12,
          backgroundColor: theme?.chat.background || '#FBF7F4',
        },
      ]}
    >
      <View style={[
        chatStyles.input.inputWrapper,
        {
          backgroundColor: theme?.chat.inputBackground || '#FFFFFF',
          borderColor: theme?.chat.inputBorder || '#3C3939',
        }
      ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Type a message..."
          placeholderTextColor={theme?.chat.inputPlaceholder || '#9E9E9E'}
          style={[
            chatStyles.input.textInput,
            { color: theme?.chat.inputText || '#2C2C2C' }
          ]}
          multiline
          returnKeyType="default"
          blurOnSubmit={false}
          editable={!isLoading}
        />

        {/* Mic/Send Button - Inside Input */}
        <TouchableOpacity
          onPress={handleActionPress}
          disabled={isLoading}
          style={[
            chatStyles.input.actionButton,
            isLoading && { opacity: 0.6 },
          ]}
        >
          {
            showSendIcon ? (
              <SendSvg width={24} height={24} color={theme?.chat.inputText || '#2C2C2C'}/>
            ) : null
          }
        </TouchableOpacity>
      </View>
    </View>
  );
});

ChatInputArea.displayName = 'ChatInputArea';
