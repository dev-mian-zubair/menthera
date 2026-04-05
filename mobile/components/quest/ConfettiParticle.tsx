import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ConfettiParticleProps {
  active: boolean;
  intensity?: 'subtle' | 'medium' | 'high';
}

const COLORS = ['#5A86FF', '#6ED7C4', '#E9D5FF', '#BFDBFE', '#A7F3D0', '#FFB3BA'];

export const ConfettiParticle: React.FC<ConfettiParticleProps> = ({
  active,
  intensity = 'subtle',
}) => {
  const particleCount = intensity === 'subtle' ? 8 : intensity === 'medium' ? 15 : 25;

  const particles = useRef(
    Array.from({ length: particleCount }, () => ({
      translateY: useRef(new Animated.Value(0)).current,
      translateX: useRef(new Animated.Value(0)).current,
      opacity: useRef(new Animated.Value(0)).current,
      rotation: useRef(new Animated.Value(0)).current,
      x: Math.random() * 100, // percentage
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 6 + 4, // 4-10px
    }))
  ).current;

  useEffect(() => {
    if (active) {
      particles.forEach((particle, index) => {
        // Reset values
        particle.translateY.setValue(0);
        particle.translateX.setValue(0);
        particle.opacity.setValue(0);
        particle.rotation.setValue(0);

        // Animate
        Animated.sequence([
          Animated.delay(index * 30),
          Animated.parallel([
            Animated.timing(particle.translateY, {
              toValue: -150 - Math.random() * 100,
              duration: 800 + Math.random() * 400,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateX, {
              toValue: (Math.random() - 0.5) * 100,
              duration: 800 + Math.random() * 400,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 500,
                delay: 200,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(particle.rotation, {
              toValue: Math.random() * 720 - 360,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: `${particle.x}%`,
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size,
              transform: [
                { translateY: particle.translateY },
                { translateX: particle.translateX },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [-360, 360],
                    outputRange: ['-360deg', '360deg'],
                  }),
                },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 300,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
});
