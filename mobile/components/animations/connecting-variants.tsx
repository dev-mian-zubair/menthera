import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

interface AnimationProps {
  size?: number;
  color?: string;
}

// VARIANT 1: Minimalist Spin
export const MinimalistSpin: React.FC<AnimationProps> = ({ size = 200, color = '#2C2C2C' }) => {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 3000,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ rotate: rotation }],
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderTopColor: color,
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: `${color}30`,
          }}
        />
      </Animated.View>
    </View>
  );
};

// VARIANT 2: Premium Cascade
export const PremiumCascade: React.FC<AnimationProps> = ({ size = 200, color = '#2C2C2C' }) => {
  const cascades = useRef(
    Array.from({ length: 5 }, () => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.9),
    }))
  ).current;

  useEffect(() => {
    const animations = cascades.map((cascade, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 300),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(cascade.opacity, {
                toValue: 0.5 - index * 0.06,
                duration: 400,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
              }),
              Animated.timing(cascade.opacity, {
                toValue: 0,
                duration: 1100,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(cascade.scale, {
              toValue: 1,
              duration: 1500,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(cascade.scale, {
            toValue: 0.9,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach(anim => anim.start());
    return () => animations.forEach(anim => anim.stop());
  }, [cascades]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {cascades.map((cascade, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: color,
            opacity: cascade.opacity,
            transform: [{ scale: cascade.scale }],
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
