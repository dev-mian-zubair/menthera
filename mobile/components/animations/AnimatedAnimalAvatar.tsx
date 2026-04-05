import React from 'react';
import { View } from 'react-native';
import {
  AnimatedBear,
  AnimatedCat,
  AnimatedDog,
  AnimatedFox,
  AnimatedFrog,
  AnimatedHamster,
  AnimatedLion,
  AnimatedMonkey,
  AnimatedMouse,
  AnimatedPanda,
  AnimatedPig,
  AnimatedRabbit,
} from './animals';
import { Avatar } from '@/components/common/Avatar';

export type AnimationPreset = 'idle' | 'speaking' | 'listening' | 'celebrating';

interface AnimatedAnimalAvatarProps {
  avatar: string;
  size?: number;
  isActive?: boolean;
  audioLevel?: number;
  animationPreset?: AnimationPreset;
}

/**
 * Map of avatar keys to their animated components
 * Start with bear, expand to other animals as we validate the approach
 */
const ANIMATED_AVATAR_MAP: Record<string, React.FC<{
  size?: number;
  isActive?: boolean;
  audioLevel?: number;
}>> = {
  bear: AnimatedBear,
  'cat-face': AnimatedCat,
  'dog-face': AnimatedDog,
  fox: AnimatedFox,
  frog: AnimatedFrog,
  hamster: AnimatedHamster,
  lion: AnimatedLion,
  'monkey-face': AnimatedMonkey,
  'mouse-face': AnimatedMouse,
  panda: AnimatedPanda,
  'pig-face': AnimatedPig,
  'rabbit-face': AnimatedRabbit,
};

/**
 * Check if an avatar has an animated version available
 */
export const hasAnimatedVersion = (avatarKey: string): boolean => {
  return avatarKey in ANIMATED_AVATAR_MAP;
};

/**
 * AnimatedAnimalAvatar
 *
 * Wrapper component that renders animated SVG avatars when available,
 * falling back to static avatars for animals not yet animated.
 *
 * Features:
 * - Automatic animation based on `isActive` state
 * - Audio-reactive animations via `audioLevel` prop
 * - Animation presets for different states (idle, speaking, listening, celebrating)
 * - Graceful fallback to static Avatar for non-animated types
 *
 * Usage:
 * ```tsx
 * <AnimatedAnimalAvatar
 *   avatar="bear"
 *   size={200}
 *   isActive={isConnected}
 *   audioLevel={audioLevel}
 * />
 * ```
 */
export const AnimatedAnimalAvatar: React.FC<AnimatedAnimalAvatarProps> = ({
  avatar,
  size = 128,
  isActive = false,
  audioLevel = 0,
  animationPreset = 'idle',
}) => {
  // Check if we have an animated version for this avatar
  const AnimatedComponent = ANIMATED_AVATAR_MAP[avatar];

  if (AnimatedComponent) {
    return (
      <AnimatedComponent
        size={size}
        isActive={isActive || animationPreset !== 'idle'}
        audioLevel={audioLevel}
      />
    );
  }

  // Fallback to static avatar for non-animated animals
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Avatar avatar={avatar} size={size} />
    </View>
  );
};

export default AnimatedAnimalAvatar;
