import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { chatStyles } from '@/lib/styles/screens/tabs/chat.styles';

interface TypingIndicatorProps {
  visible: boolean;
  color?: string;
}

/**
 * TypingIndicator Component
 * Displays animated typing dots to indicate agent is typing
 */
export const TypingIndicator = React.memo(({ visible, color = '#5A86FF' }: TypingIndicatorProps) => {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    // Create animation sequence for three dots
    const sequence = Animated.sequence([
      Animated.timing(dot1Opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(dot1Opacity, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(dot2Opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(dot2Opacity, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(dot3Opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(dot3Opacity, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    const loop = Animated.loop(sequence);
    loop.start();

    return () => {
      loop.stop();
    };
  }, [visible, dot1Opacity, dot2Opacity, dot3Opacity]);

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[
        chatStyles.messages.messageContainer,
        chatStyles.messages.messageContainerAgent,
        { paddingHorizontal: 16 },
      ]}
    >
      <View
        style={[
          chatStyles.messages.bubble,
          chatStyles.messages.bubbleAgent,
          {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            minHeight: 40,
          },
        ]}
      >
        {/* Dot 1 */}
        <Animated.View
          style={[
            {
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
              marginHorizontal: 4,
              opacity: dot1Opacity,
            },
          ]}
        />
        {/* Dot 2 */}
        <Animated.View
          style={[
            {
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
              marginHorizontal: 4,
              opacity: dot2Opacity,
            },
          ]}
        />
        {/* Dot 3 */}
        <Animated.View
          style={[
            {
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color,
              marginHorizontal: 4,
              opacity: dot3Opacity,
            },
          ]}
        />
      </View>
    </View>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
