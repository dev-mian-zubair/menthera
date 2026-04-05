import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';

/**
 * Animation timing constants
 */
const BLINK_DURATION = 150; // How long eyes stay closed
const BLINK_MIN_INTERVAL = 3000; // Minimum time between blinks
const BLINK_MAX_INTERVAL = 6000; // Maximum time between blinks
const BREATHING_DURATION = 2000; // Full breath cycle
const WIGGLE_DURATION = 500; // Ear wiggle period
const WIGGLE_ANGLE = 3; // Degrees of rotation

/**
 * Hook for eye blink animation
 * Eyes blink at random intervals (3-6 seconds)
 */
export function useBlinkAnimation(isActive: boolean = true) {
  const blinkProgress = useSharedValue(0);
  const isBlinkingRef = { current: false };

  useEffect(() => {
    if (!isActive) {
      blinkProgress.value = 0;
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const triggerBlink = () => {
      if (!isBlinkingRef.current && isMounted) {
        isBlinkingRef.current = true;
        blinkProgress.value = withSequence(
          withTiming(1, { duration: BLINK_DURATION / 2, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: BLINK_DURATION / 2, easing: Easing.in(Easing.ease) })
        );
        // Reset blinking flag after animation
        setTimeout(() => {
          isBlinkingRef.current = false;
        }, BLINK_DURATION);
      }
    };

    const scheduleBlink = () => {
      if (!isMounted) return;
      const interval = BLINK_MIN_INTERVAL + Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL);
      timeoutId = setTimeout(() => {
        triggerBlink();
        scheduleBlink();
      }, interval);
    };

    // Start blink cycle after initial delay
    timeoutId = setTimeout(scheduleBlink, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      cancelAnimation(blinkProgress);
    };
  }, [isActive, blinkProgress]);

  const eyeAnimatedStyle = useAnimatedStyle(() => {
    // Scale Y from 1 to 0.1 (almost closed) and back
    const scaleY = interpolate(blinkProgress.value, [0, 1], [1, 0.1]);
    return {
      transform: [{ scaleY }],
    };
  });

  return {
    blinkProgress,
    eyeAnimatedStyle,
  };
}

/**
 * Hook for ear/whisker wiggle animation
 * Oscillating rotation for playful movement
 */
export function useWiggleAnimation(isActive: boolean = true, direction: 'left' | 'right' = 'left') {
  const wiggleRotation = useSharedValue(0);

  useEffect(() => {
    if (!isActive) {
      wiggleRotation.value = withTiming(0, { duration: 200 });
      return;
    }

    // Continuous subtle wiggle
    const angle = direction === 'left' ? WIGGLE_ANGLE : -WIGGLE_ANGLE;
    wiggleRotation.value = withRepeat(
      withSequence(
        withTiming(angle, { duration: WIGGLE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(-angle, { duration: WIGGLE_DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      true // Reverse
    );

    return () => {
      cancelAnimation(wiggleRotation);
    };
  }, [isActive, direction, wiggleRotation]);

  const wiggleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${wiggleRotation.value}deg` }],
    };
  });

  return {
    wiggleRotation,
    wiggleAnimatedStyle,
  };
}

/**
 * Hook for breathing animation
 * Subtle scale pulse (1.0 → 1.02)
 */
export function useBreathingAnimation(isActive: boolean = true) {
  const breathScale = useSharedValue(1);

  useEffect(() => {
    if (!isActive) {
      breathScale.value = withTiming(1, { duration: 300 });
      return;
    }

    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: BREATHING_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: BREATHING_DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite
      false // Don't reverse, let sequence handle it
    );

    return () => {
      cancelAnimation(breathScale);
    };
  }, [isActive, breathScale]);

  const breathingAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: breathScale.value }],
    };
  });

  return {
    breathScale,
    breathingAnimatedStyle,
  };
}

/**
 * Hook for speaking animation
 * Responds to audioLevel prop for reactive mouth/expression changes
 */
export function useSpeakingAnimation(audioLevel: number = 0, isActive: boolean = true) {
  const mouthOpenness = useSharedValue(0);
  const expressionIntensity = useSharedValue(0);

  useEffect(() => {
    if (!isActive || audioLevel < 0.1) {
      mouthOpenness.value = withTiming(0, { duration: 150 });
      expressionIntensity.value = withTiming(0, { duration: 150 });
      return;
    }

    // Map audio level to mouth openness (0-1 range)
    const targetOpenness = Math.min(audioLevel * 1.5, 1);
    mouthOpenness.value = withTiming(targetOpenness, { duration: 100 });

    // Expression intensity follows audio
    expressionIntensity.value = withTiming(audioLevel, { duration: 100 });
  }, [audioLevel, isActive, mouthOpenness, expressionIntensity]);

  const mouthAnimatedStyle = useAnimatedStyle(() => {
    // Scale Y for mouth opening effect
    const scaleY = interpolate(mouthOpenness.value, [0, 1], [1, 1.3]);
    return {
      transform: [{ scaleY }],
    };
  });

  const expressionAnimatedStyle = useAnimatedStyle(() => {
    // Slight upward movement for excited expression
    const translateY = interpolate(expressionIntensity.value, [0, 1], [0, -2]);
    return {
      transform: [{ translateY }],
    };
  });

  return {
    mouthOpenness,
    expressionIntensity,
    mouthAnimatedStyle,
    expressionAnimatedStyle,
  };
}

/**
 * Combined animation hook for full avatar animation
 * Provides all animations in one package
 */
export function useAvatarAnimations(
  animationState: 'idle' | 'speaking' | 'listening' | 'celebrating' = 'idle',
  audioLevel: number = 0
) {
  const isActive = animationState !== 'idle';
  const isSpeaking = animationState === 'speaking' || audioLevel > 0.1;

  const blink = useBlinkAnimation(true); // Always blink
  const leftEarWiggle = useWiggleAnimation(isActive, 'left');
  const rightEarWiggle = useWiggleAnimation(isActive, 'right');
  const breathing = useBreathingAnimation(isActive);
  const speaking = useSpeakingAnimation(audioLevel, isSpeaking);

  return {
    blink,
    leftEarWiggle,
    rightEarWiggle,
    breathing,
    speaking,
    isActive,
    isSpeaking,
  };
}
