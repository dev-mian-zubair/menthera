import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface MicrophoneVisualizerProps {
  audioLevel: number; // 0.0 to 1.0
  isActive: boolean;
  barCount?: number;
  barColor?: string;
  size?: number;
}

export const MicrophoneVisualizer: React.FC<MicrophoneVisualizerProps> = ({
  audioLevel,
  isActive,
  barCount = 5,
  barColor = '#5A86FF',
  size = 60,
}) => {
  // Create animated values for each bar
  const barAnimations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.2))
  ).current;

  useEffect(() => {
    if (!isActive) {
      // Reset all bars to minimum height when inactive
      Animated.parallel(
        barAnimations.map(anim =>
          Animated.timing(anim, {
            toValue: 0.2,
            duration: 200,
            useNativeDriver: false,
          })
        )
      ).start();
      return;
    }

    // Animate bars based on audio level with staggered effect
    const animations = barAnimations.map((anim, index) => {
      // Create variation for each bar (some bars higher, some lower)
      const variation = Math.sin((index / barCount) * Math.PI);
      const targetHeight = 0.2 + audioLevel * 0.8 * variation;

      return Animated.spring(anim, {
        toValue: Math.max(0.2, Math.min(1, targetHeight)),
        useNativeDriver: false,
        tension: 300,
        friction: 10,
      });
    });

    Animated.parallel(animations).start();
  }, [audioLevel, isActive, barAnimations, barCount]);

  const barWidth = size / (barCount * 2 - 1); // Account for gaps
  const maxBarHeight = size * 0.8;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {barAnimations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              width: barWidth,
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [maxBarHeight * 0.2, maxBarHeight],
              }),
              backgroundColor: barColor,
              marginHorizontal: barWidth / 4,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 2,
  },
});
