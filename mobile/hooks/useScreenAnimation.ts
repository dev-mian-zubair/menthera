import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { logger } from '@/lib/utils/logger';

/**
 * Hook for unified screen entrance animations
 * Provides fade-in and slide-up effects for smooth transitions
 * Used by both authenticated (home) and unauthenticated (welcome) screens
 */
export const useScreenAnimation = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Animate in when component mounts
  useEffect(() => {
    logger.debug('[useScreenAnimation] 🎬 Starting screen entrance animation');
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      logger.debug('[useScreenAnimation] ✓ Screen entrance animation complete');
    });
  }, [fadeAnim, slideAnim]);

  return {
    animatedStyle: {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    },
  };
};
