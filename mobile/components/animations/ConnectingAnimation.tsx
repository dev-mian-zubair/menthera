import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

interface ConnectingAnimationProps {
  size?: number;
  color?: string;
}

export const ConnectingAnimation: React.FC<ConnectingAnimationProps> = ({
  size = 200,
  color = '#2C2C2C',
}) => {
  // Single rotating animation value
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Smooth continuous rotation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Gentle breathing scale animation
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rotateAnimation.start();
    scaleAnimation.start();

    return () => {
      rotateAnimation.stop();
      scaleAnimation.stop();
    };
  }, [rotateAnim, scaleAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Animated spinner circle with gradient effect */}
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ rotate }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Top arc */}
        <View
          style={[
            styles.arc,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderTopColor: color,
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
            },
          ]}
        />
      </Animated.View>

      {/* Static bottom arc for continuous look */}
      <View
        style={[
          styles.staticArc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: `${color}33`,
            borderLeftColor: `${color}66`,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  spinner: {
    position: 'absolute',
  },
  arc: {
    borderWidth: 2,
  },
  staticArc: {
    position: 'absolute',
    borderWidth: 2,
  },
});
