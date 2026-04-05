import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import {
  useBlinkAnimation,
  useBreathingAnimation,
  useSpeakingAnimation,
} from '@/hooks/useAvatarAnimations';

interface AnimatedFrogProps {
  size?: number;
  isActive?: boolean;
  audioLevel?: number;
}

export const AnimatedFrog: React.FC<AnimatedFrogProps> = ({
  size = 128,
  isActive = false,
  audioLevel = 0,
}) => {
  const { eyeAnimatedStyle } = useBlinkAnimation(true);
  const { breathingAnimatedStyle } = useBreathingAnimation(isActive);
  const { mouthAnimatedStyle } = useSpeakingAnimation(audioLevel, isActive);

  const scale = size / 128;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.absoluteFill, breathingAnimatedStyle]}>
        <Svg width={size} height={size} viewBox="0 0 128 128" style={StyleSheet.absoluteFill}>
          {/* Green body */}
          <Path fill="#bdcf46" d="M125.52 61.13c-1.46-4.33-2.75-8.61-4.52-12.88c-.76-1.85-1.4-3.19-1.59-5.16c-.4-4.17 1.57-8.05 1.83-12.24c.32-4.91-.22-9.91-2.05-14.51c-.97-2.41-2.58-4.83-4.6-6.42c-8.41-6.68-22.38-6.17-30.7.39c-2.94 2.33-4.15 6.07-6.57 8.83c-2.57 2.94-24.06 2.94-26.63 0c-2.42-2.76-3.63-6.5-6.57-8.83c-8.32-6.56-22.3-7.07-30.71-.39c-2.01 1.59-3.62 4.01-4.58 6.42c-1.84 4.6-2.38 9.6-2.07 14.51c.28 4.19 2.24 8.07 1.84 12.24c-.19 1.97-.83 3.31-1.59 5.16c-1.78 4.27-3.06 8.56-4.52 12.88C-2.06 74.57.46 91.9 9.57 102.78c6.87 8.21 17.27 13.88 27.41 16.87c8.62 2.55 17.83 3.21 26.79 3.21h.46c8.96 0 18.17-.66 26.79-3.21c10.13-3 20.54-8.66 27.41-16.87c9.11-10.88 11.63-28.21 7.09-41.65" />
          {/* Small eye details */}
          <Path fill="#2f2f2f" d="M77.02 38.17c1.84-.04 3.86 1.37 3.38 4c-.55 3.04-5.55 2.63-6.1-.32c-.46-2.47 1.07-3.65 2.72-3.68m-26.51 0c1.67.03 3.19 1.21 2.72 3.68c-.55 2.95-5.55 3.36-6.10.32c-.48-2.63 1.54-4.03 3.38-4" />
          {/* Orange mouth/smile */}
          <Path fill="#ed6c30" d="M63.92 70.64c-25.47 0-42.84-16.44-40.33-21.62c2.5-5.19 19.99 5.88 40.32 5.88c20.28-.01 37.78-11.08 40.27-5.88c2.51 5.19-14.85 21.62-40.26 21.62" />
        </Svg>

        {/* Left Big Eye - Animated blink */}
        <Animated.View
          style={[
            styles.eyeContainer,
            { left: 12 * scale, top: 15 * scale, width: 14 * scale, height: 18 * scale },
            eyeAnimatedStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="12 15 14 18">
            <Ellipse cx="18.91" cy="24.22" fill="#2f2f2f" rx="6.98" ry="8.72" />
          </Svg>
        </Animated.View>

        {/* Right Big Eye - Animated blink */}
        <Animated.View
          style={[
            styles.eyeContainer,
            { left: 94 * scale, top: 15 * scale, width: 14 * scale, height: 18 * scale },
            eyeAnimatedStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="94 15 14 18">
            <Ellipse cx="101.64" cy="24.22" fill="#2f2f2f" rx="6.99" ry="8.72" />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative' },
  absoluteFill: { ...StyleSheet.absoluteFillObject },
  eyeContainer: { position: 'absolute' },
});

export default AnimatedFrog;
