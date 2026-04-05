/**
 * Animation Presets
 *
 * Common animation configurations for React Native Animated API
 * and Reanimated library.
 */

import { Easing } from 'react-native';
import { tokens } from './tokens';

// ==================== TIMING CONFIGURATIONS ====================

/**
 * Animation timing presets
 */
export const timing = {
  instant: tokens.timing.instant,
  fast: tokens.timing.fast,
  normal: tokens.timing.normal,
  slow: tokens.timing.slow,
  slower: tokens.timing.slower,
};

// ==================== EASING FUNCTIONS ====================

/**
 * Easing function presets
 */
export const easing = {
  // Linear
  linear: Easing.linear,

  // Ease
  ease: Easing.ease,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),

  // Quad
  quadIn: Easing.in(Easing.quad),
  quadOut: Easing.out(Easing.quad),
  quadInOut: Easing.inOut(Easing.quad),

  // Cubic
  cubicIn: Easing.in(Easing.cubic),
  cubicOut: Easing.out(Easing.cubic),
  cubicInOut: Easing.inOut(Easing.cubic),

  // Bezier (custom curves)
  bezier: (x1: number, y1: number, x2: number, y2: number) =>
    Easing.bezier(x1, y1, x2, y2),

  // Elastic
  elastic: (bounciness: number = 1) => Easing.elastic(bounciness),

  // Bounce
  bounce: Easing.bounce,

  // Back
  back: (overshoot: number = 1.70158) => Easing.back(overshoot),

  // Circle
  circle: Easing.circle,
};

// ==================== ANIMATION PRESETS ====================

/**
 * Fade animations
 */
export const fadeAnimations = {
  fadeIn: {
    duration: timing.normal,
    easing: easing.easeOut,
    from: { opacity: 0 },
    to: { opacity: 1 },
  },

  fadeOut: {
    duration: timing.normal,
    easing: easing.easeIn,
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  fadeInFast: {
    duration: timing.fast,
    easing: easing.easeOut,
    from: { opacity: 0 },
    to: { opacity: 1 },
  },

  fadeOutFast: {
    duration: timing.fast,
    easing: easing.easeIn,
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
};

/**
 * Scale animations
 */
export const scaleAnimations = {
  scaleIn: {
    duration: timing.normal,
    easing: easing.easeOut,
    from: { transform: [{ scale: 0.8 }] },
    to: { transform: [{ scale: 1 }] },
  },

  scaleOut: {
    duration: timing.normal,
    easing: easing.easeIn,
    from: { transform: [{ scale: 1 }] },
    to: { transform: [{ scale: 0.8 }] },
  },

  scaleInBounce: {
    duration: timing.slow,
    easing: easing.back(2),
    from: { transform: [{ scale: 0 }] },
    to: { transform: [{ scale: 1 }] },
  },

  pulse: {
    duration: timing.normal,
    easing: easing.easeInOut,
    from: { transform: [{ scale: 1 }] },
    to: { transform: [{ scale: 1.05 }] },
    loop: true,
  },
};

/**
 * Slide animations
 */
export const slideAnimations = {
  slideInUp: {
    duration: timing.normal,
    easing: easing.easeOut,
    from: { transform: [{ translateY: 50 }] },
    to: { transform: [{ translateY: 0 }] },
  },

  slideOutDown: {
    duration: timing.normal,
    easing: easing.easeIn,
    from: { transform: [{ translateY: 0 }] },
    to: { transform: [{ translateY: 50 }] },
  },

  slideInDown: {
    duration: timing.normal,
    easing: easing.easeOut,
    from: { transform: [{ translateY: -50 }] },
    to: { transform: [{ translateY: 0 }] },
  },

  slideOutUp: {
    duration: timing.normal,
    easing: easing.easeIn,
    from: { transform: [{ translateY: 0 }] },
    to: { transform: [{ translateY: -50 }] },
  },

  slideInLeft: {
    duration: timing.normal,
    easing: easing.easeOut,
    from: { transform: [{ translateX: -50 }] },
    to: { transform: [{ translateX: 0 }] },
  },

  slideOutRight: {
    duration: timing.normal,
    easing: easing.easeIn,
    from: { transform: [{ translateX: 0 }] },
    to: { transform: [{ translateX: 50 }] },
  },

  slideInRight: {
    duration: timing.normal,
    easing: easing.easeOut,
    from: { transform: [{ translateX: 50 }] },
    to: { transform: [{ translateX: 0 }] },
  },

  slideOutLeft: {
    duration: timing.normal,
    easing: easing.easeIn,
    from: { transform: [{ translateX: 0 }] },
    to: { transform: [{ translateX: -50 }] },
  },
};

/**
 * Rotation animations
 */
export const rotateAnimations = {
  rotate360: {
    duration: timing.slow,
    easing: easing.linear,
    from: { transform: [{ rotate: '0deg' }] },
    to: { transform: [{ rotate: '360deg' }] },
    loop: true,
  },

  rotate180: {
    duration: timing.normal,
    easing: easing.easeInOut,
    from: { transform: [{ rotate: '0deg' }] },
    to: { transform: [{ rotate: '180deg' }] },
  },

  shake: {
    duration: timing.slow,
    easing: easing.linear,
    keyframes: [
      { transform: [{ rotate: '0deg' }] },
      { transform: [{ rotate: '-10deg' }] },
      { transform: [{ rotate: '10deg' }] },
      { transform: [{ rotate: '-10deg' }] },
      { transform: [{ rotate: '10deg' }] },
      { transform: [{ rotate: '0deg' }] },
    ],
  },
};

/**
 * Combined animations
 */
export const combinedAnimations = {
  // Fade in from bottom (modal entrance)
  fadeInSlideUp: {
    duration: timing.normal,
    easing: easing.easeOut,
    from: {
      opacity: 0,
      transform: [{ translateY: 30 }],
    },
    to: {
      opacity: 1,
      transform: [{ translateY: 0 }],
    },
  },

  // Fade out to bottom (modal exit)
  fadeOutSlideDown: {
    duration: timing.normal,
    easing: easing.easeIn,
    from: {
      opacity: 1,
      transform: [{ translateY: 0 }],
    },
    to: {
      opacity: 0,
      transform: [{ translateY: 30 }],
    },
  },

  // Scale and fade in
  scaleInFade: {
    duration: timing.normal,
    easing: easing.easeOut,
    from: {
      opacity: 0,
      transform: [{ scale: 0.9 }],
    },
    to: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
  },

  // Scale and fade out
  scaleOutFade: {
    duration: timing.normal,
    easing: easing.easeIn,
    from: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
    to: {
      opacity: 0,
      transform: [{ scale: 0.9 }],
    },
  },

  // Bounce entrance
  bounceIn: {
    duration: timing.slow,
    easing: easing.back(2),
    from: {
      opacity: 0,
      transform: [{ scale: 0.3 }],
    },
    to: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
  },
};

/**
 * Loading/skeleton animations
 */
export const loadingAnimations = {
  // Pulsing opacity
  pulse: {
    duration: timing.slower,
    easing: easing.easeInOut,
    from: { opacity: 0.4 },
    to: { opacity: 1 },
    loop: true,
    reverse: true,
  },

  // Shimmer effect (requires gradient)
  shimmer: {
    duration: timing.slower * 2,
    easing: easing.linear,
    from: { transform: [{ translateX: -100 }] },
    to: { transform: [{ translateX: 100 }] },
    loop: true,
  },

  // Spinning
  spin: {
    duration: timing.slow,
    easing: easing.linear,
    from: { transform: [{ rotate: '0deg' }] },
    to: { transform: [{ rotate: '360deg' }] },
    loop: true,
  },

  // Dots animation (for typing indicator)
  dots: {
    duration: timing.normal * 2,
    easing: easing.easeInOut,
    stagger: timing.fast,
    from: { opacity: 0.3, transform: [{ translateY: 0 }] },
    to: { opacity: 1, transform: [{ translateY: -4 }] },
    loop: true,
    reverse: true,
  },
};

/**
 * Swipe/gesture animations
 */
export const gestureAnimations = {
  // Card swipe right (like)
  swipeRight: {
    duration: timing.normal,
    easing: easing.easeOut,
    from: {
      transform: [{ translateX: 0 }, { rotate: '0deg' }],
      opacity: 1,
    },
    to: {
      transform: [{ translateX: 300 }, { rotate: '20deg' }],
      opacity: 0,
    },
  },

  // Card swipe left (nope)
  swipeLeft: {
    duration: timing.normal,
    easing: easing.easeOut,
    from: {
      transform: [{ translateX: 0 }, { rotate: '0deg' }],
      opacity: 1,
    },
    to: {
      transform: [{ translateX: -300 }, { rotate: '-20deg' }],
      opacity: 0,
    },
  },

  // Spring back (card returns to center)
  springBack: {
    duration: timing.fast,
    easing: easing.elastic(1.5),
    from: {
      transform: [{ translateX: 0 }, { rotate: '0deg' }],
    },
    to: {
      transform: [{ translateX: 0 }, { rotate: '0deg' }],
    },
  },
};

/**
 * Spring animation configurations
 * For use with Animated.spring or Reanimated withSpring
 */
export const springs = {
  default: {
    damping: 15,
    mass: 1,
    stiffness: 150,
  },

  gentle: {
    damping: 20,
    mass: 1,
    stiffness: 100,
  },

  bouncy: {
    damping: 10,
    mass: 1,
    stiffness: 200,
  },

  stiff: {
    damping: 25,
    mass: 1,
    stiffness: 300,
  },

  slow: {
    damping: 30,
    mass: 1.5,
    stiffness: 80,
  },
};

/**
 * Layout animation configurations
 * For use with LayoutAnimation
 */
export const layoutAnimations = {
  easeInEaseOut: {
    duration: timing.normal,
    create: {
      type: 'easeInEaseOut' as const,
      property: 'opacity' as const,
    },
    update: {
      type: 'easeInEaseOut' as const,
    },
    delete: {
      type: 'easeInEaseOut' as const,
      property: 'opacity' as const,
    },
  },

  spring: {
    duration: timing.slow,
    create: {
      type: 'spring' as const,
      property: 'opacity' as const,
      springDamping: 0.7,
    },
    update: {
      type: 'spring' as const,
      springDamping: 0.7,
    },
    delete: {
      type: 'spring' as const,
      property: 'opacity' as const,
      springDamping: 0.7,
    },
  },

  linear: {
    duration: timing.normal,
    create: {
      type: 'linear' as const,
      property: 'opacity' as const,
    },
    update: {
      type: 'linear' as const,
    },
    delete: {
      type: 'linear' as const,
      property: 'opacity' as const,
    },
  },
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Create a custom timing animation configuration
 */
export const createTimingAnimation = (
  duration: number = timing.normal,
  easingFn: any = easing.easeInOut
) => ({
  duration,
  easing: easingFn,
  useNativeDriver: true,
});

/**
 * Create a custom spring animation configuration
 */
export const createSpringAnimation = (
  damping: number = 15,
  stiffness: number = 150,
  mass: number = 1
) => ({
  damping,
  mass,
  stiffness,
  useNativeDriver: true,
});

/**
 * Delay helper for sequential animations
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Stagger helper - creates array of delays for staggered animations
 */
export const stagger = (count: number, delayMs: number = timing.fast): number[] => {
  return Array.from({ length: count }, (_, i) => i * delayMs);
};
