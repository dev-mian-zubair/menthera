/**
 * FloatingDecorations - Animated Background Orbs/Circles
 *
 * Creates a calming atmosphere with subtly animated floating circles
 * that breathe and drift slowly across the background.
 */

import React, { useMemo } from 'react';
import { View, Animated, ViewStyle, StyleSheet, Dimensions } from 'react-native';
import { useBreathingAnimation, useFloatingAnimation } from '@/hooks/useBreathingAnimation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FloatingDecorationsProps {
  /** Colors for the three floating circles */
  colors: {
    circle1: string;
    circle2: string;
    circle3: string;
  };
  /** Whether to show the breathing orb (default: true) */
  showBreathingOrb?: boolean;
  /** Color for the breathing orb */
  breathingOrbColor?: string;
}

/**
 * Individual floating circle component with its own animation
 */
const FloatingCircle: React.FC<{
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  floatDistance?: number;
  duration?: number;
  opacity?: number;
}> = ({
  color,
  size,
  initialX,
  initialY,
  floatDistance = 15,
  duration = 5000,
  opacity = 1,
}) => {
  const { translateX, translateY } = useFloatingAnimation({
    maxX: floatDistance,
    maxY: floatDistance * 0.8,
    duration,
  });

  const { breathingValue } = useBreathingAnimation({
    minScale: 0.95,
    maxScale: 1.05,
    duration: duration * 0.8,
  });

  return (
    <Animated.View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: initialX,
          top: initialY,
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale: breathingValue },
          ],
        },
      ]}
    />
  );
};

/**
 * Central breathing orb - larger, more prominent, positioned in hero area
 */
const BreathingOrb: React.FC<{
  color: string;
  size?: number;
}> = ({ color, size = 200 }) => {
  const { breathingValue } = useBreathingAnimation({
    minScale: 1,
    maxScale: 1.08,
    duration: 3500,
  });

  return (
    <Animated.View
      style={[
        styles.breathingOrb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale: breathingValue }],
        },
      ]}
    />
  );
};

export const FloatingDecorations: React.FC<FloatingDecorationsProps> = ({
  colors,
  showBreathingOrb = true,
  breathingOrbColor,
}) => {
  // Define fixed positions for circles (positioned around the screen edges)
  // Reduced sizes and float distances for a more subtle, calming effect
  const circleConfigs = useMemo(() => [
    {
      color: colors.circle1,
      size: 120,
      x: -40,
      y: 100,
      floatDistance: 10,
      duration: 8000,
    },
    {
      color: colors.circle2,
      size: 100,
      x: SCREEN_WIDTH - 60,
      y: 220,
      floatDistance: 8,
      duration: 10000,
    },
  ], [colors]);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Floating circles in background */}
      {circleConfigs.map((config, index) => (
        <FloatingCircle
          key={index}
          color={config.color}
          size={config.size}
          initialX={config.x}
          initialY={config.y}
          floatDistance={config.floatDistance}
          duration={config.duration}
        />
      ))}

      {/* Central breathing orb - reduced size for subtlety */}
      {showBreathingOrb && breathingOrbColor && (
        <BreathingOrb color={breathingOrbColor} size={160} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
  },
  breathingOrb: {
    position: 'absolute',
    top: 80,
    left: SCREEN_WIDTH / 2 - 80,
    opacity: 0.10,
  },
});

export default FloatingDecorations;
