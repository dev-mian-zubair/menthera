import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Hook for creating a subtle breathing/pulsing animation
 * Used for calming UI elements like orbs and floating decorations
 *
 * @param options Configuration options for the animation
 * @returns Animated value that oscillates between minScale and maxScale
 */
interface BreathingAnimationOptions {
  /** Minimum scale value (default: 1) */
  minScale?: number;
  /** Maximum scale value (default: 1.05) */
  maxScale?: number;
  /** Duration of one breath cycle in ms (default: 3000) */
  duration?: number;
  /** Whether to start the animation immediately (default: true) */
  autoStart?: boolean;
}

export const useBreathingAnimation = (options: BreathingAnimationOptions = {}) => {
  const {
    minScale = 1,
    maxScale = 1.05,
    duration = 3000,
    autoStart = true,
  } = options;

  const breathingAnim = useRef(new Animated.Value(minScale)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const startAnimation = () => {
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: maxScale,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: minScale,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animationRef.current.start();
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  };

  useEffect(() => {
    if (autoStart) {
      startAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [autoStart, minScale, maxScale, duration]);

  return {
    /** Animated value for transform: [{ scale: breathingValue }] */
    breathingValue: breathingAnim,
    /** Start the breathing animation */
    start: startAnimation,
    /** Stop the breathing animation */
    stop: stopAnimation,
  };
};

/**
 * Hook for creating a floating/drifting animation
 * Used for decorative elements that slowly move around
 */
interface FloatingAnimationOptions {
  /** Maximum translation in X direction (default: 10) */
  maxX?: number;
  /** Maximum translation in Y direction (default: 10) */
  maxY?: number;
  /** Duration of one float cycle in ms (default: 4000) */
  duration?: number;
  /** Whether to start immediately (default: true) */
  autoStart?: boolean;
}

export const useFloatingAnimation = (options: FloatingAnimationOptions = {}) => {
  const {
    maxX = 10,
    maxY = 10,
    duration = 4000,
    autoStart = true,
  } = options;

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const startAnimation = () => {
    animationRef.current = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: maxX,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -maxX,
            duration: duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: duration / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -maxY,
            duration: duration * 0.75,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: maxY,
            duration: duration * 1.5,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration * 0.75,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animationRef.current.start();
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  };

  useEffect(() => {
    if (autoStart) {
      startAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [autoStart, maxX, maxY, duration]);

  return {
    translateX,
    translateY,
    start: startAnimation,
    stop: stopAnimation,
  };
};
