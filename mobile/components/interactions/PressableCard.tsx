/**
 * PressableCard
 * Reusable card wrapper with press animations and haptic feedback
 */

import React, { useRef, useCallback } from 'react';
import { Animated, Pressable, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';

// ============================================
// TYPES
// ============================================

interface PressableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
  scaleAmount?: number;
  animationDuration?: number;
}

// ============================================
// COMPONENT
// ============================================

export const PressableCard: React.FC<PressableCardProps> = ({
  children,
  onPress,
  onLongPress,
  style,
  disabled = false,
  hapticFeedback = 'light',
  scaleAmount = 0.98,
  animationDuration = 100,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  /**
   * Handle press in - scale down and haptic
   */
  const handlePressIn = useCallback(() => {
    // Haptic feedback
    if (hapticFeedback !== 'none') {
      const feedbackStyle = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      }[hapticFeedback];

      Haptics.impactAsync(feedbackStyle);
    }

    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: scaleAmount,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [hapticFeedback, scaleAnim, scaleAmount]);

  /**
   * Handle press out - scale back to normal
   */
  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export default PressableCard;
