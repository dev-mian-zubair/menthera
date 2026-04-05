import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import {
  useBlinkAnimation,
  useWiggleAnimation,
  useBreathingAnimation,
  useSpeakingAnimation,
} from '@/hooks/useAvatarAnimations';

interface AnimatedMouseProps {
  size?: number;
  isActive?: boolean;
  audioLevel?: number;
}

export const AnimatedMouse: React.FC<AnimatedMouseProps> = ({
  size = 128,
  isActive = false,
  audioLevel = 0,
}) => {
  const { eyeAnimatedStyle } = useBlinkAnimation(true);
  const { wiggleAnimatedStyle: leftEarWiggle } = useWiggleAnimation(isActive, 'left');
  const { wiggleAnimatedStyle: rightEarWiggle } = useWiggleAnimation(isActive, 'right');
  const { breathingAnimatedStyle } = useBreathingAnimation(isActive);
  const { mouthAnimatedStyle } = useSpeakingAnimation(audioLevel, isActive);

  const scale = size / 128;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.absoluteFill, breathingAnimatedStyle]}>
        <Svg width={size} height={size} viewBox="0 0 128 128" style={StyleSheet.absoluteFill}>
          {/* Whiskers - left */}
          <Path fill="#78a3ad" d="M111.67 82.98c-.13-.87-.9-1.46-1.74-1.34l-6.51 1.01l-.08 3.23l7.04-1.09c.84-.14 1.42-.94 1.29-1.81m-11.8 13.75l-1.2 2.83l8.01 2.64c.15.05.31.07.46.07c.65 0 1.25-.43 1.46-1.11c.25-.84-.19-1.73-1-2l-7.19-2.37m1.73-4.12l7.6 1.43c.09.02.19.03.28.03c.73 0 1.37-.54 1.50-1.31c.15-.86-.40-1.69-1.24-1.85l-7.39-1.39l-1.25 2.96" />
          {/* Main black snout */}
          <Ellipse cx="64.83" cy="84.39" fill="#2f2f2f" rx="31" ry="24.17" />
          {/* Blue-gray body */}
          <Path fill="#78a3ad" d="M124.6 33.3c-6.8-12.09-22.58-15.06-34.49-8.91c-5.05 2.61-9 7.04-11.01 12.36a23.4 23.4 0 0 0-1.23 4.79c-.17 1.14-.25 2.72-1.90 2.28c-.94-.26-1.87-.60-2.84-.80c0 0-.83-.15-1.77-.31c-.28-.08-.52-.09-.74-.12c-.67-.11-1.31-.20-1.67-.24c-1.69-.15-3.33-.26-4.96-.27c-1.65.01-3.29.12-4.97.27c-.36.03-1 .13-1.66.24c-.23.03-.46.04-.74.12c-.94.15-1.77.31-1.77.31c-.97.20-1.90.54-2.84.80c-1.65.45-1.73-1.14-1.90-2.28c-.24-1.63-.66-3.24-1.23-4.79c-2-5.32-5.95-9.75-11-12.36c-11.90-6.15-27.68-3.18-34.48 8.91c-6.79 12.09-1.48 29.43 10.49 35.47c8.08 4.08 12.87 2.62 12.95 3.03c.16.72-1.41 3.93-2.18 8.71c-.90 5.64.25 11.60 2.90 16.65c.92 1.75 2.04 3.45 3.29 4.97c1.30 1.59 2.87 3.12 4.53 4.34c7.20 5.26 18.30 8.05 28.63 8.23c10.32-.18 21.41-2.98 28.62-8.23c1.66-1.22 3.22-2.75 4.52-4.34c1.25-1.52 2.37-3.23 3.28-4.97c2.66-5.06 3.80-11.01 2.89-16.65c-.76-4.79-2.33-8-2.18-8.71c.1-.41 4.88 1.05 12.96-3.03c11.98-6.04 17.29-23.38 10.50-35.47" />
          {/* Ear inner */}
          <Path fill="#fff" d="M33.01 62.41c-9.66 3.48-20.63-4.16-20.82-14.23c-.16-7.73 6.72-14.19 13.98-14.81c9.47-.81 13.40 5.19 15.04 10.48c1.13 3.67.86 6.52.57 7.02c-.60 1.02-7.63 11.13-8.77 11.54m62.54 0c9.66 3.48 20.63-4.16 20.82-14.23c.16-7.73-6.72-14.19-13.98-14.81c-9.47-.81-13.40 5.19-15.04 10.48c-1.13 3.67-.87 6.52-.57 7.02c.60 1.02 7.64 11.13 8.77 11.54" />
          {/* Pink nose */}
          <Path fill="#fff" d="M63.07 106.59c-.72.04-1.52-.31-2.03-.76c-.91-.79-1.54-2.12-1.89-3.58c-.32-1.38-.63-2.74-.68-4.17c-.06-1.43 1.26-.94 2.34-1.10c.99-.15 2-.97 2.83-1.47c1.21-.74 2.18.37 3.23.88c.92.45 1.77.65 2.72.48c.99-.19 1.21.32.95 1.84c-.20 1.25-.38 2.51-.68 3.75c-.26 1.14-.64 2.26-1.28 3.25c-.41.63-1.19.95-1.92.91c-.60-.03-.92-.30-1.37-.65c-.59-.46-.76-.18-1.22.23c-.27.25-.63.37-1 .39" />
          {/* Mouth detail */}
          <Path fill="#2f2f2f" d="M62.65 90.21c-.21.03-.43.04-.64.03c.08 0 .06 2.95.04 3.22c-.17 1.56-1.67 2.07-3.04 2.01c-1.30-.06-2.45-.56-3.58-1.17c-.50-.27-1.10-.59-1.66-.30c-.73.38-.66 1.23-.29 1.85c.53.94 1.53 1.57 2.50 2.01c1.53.69 3.35 1.02 5.01.67c.79-.17 1.49-.50 2.13-1c1.60-1.26 3.34.43 5.01.82c1.63.37 3.38.28 4.92-.37c1.08-.45 3.53-1.96 3.28-3.40c-.09-.60-.49-1.07-1.14-.99c-.70.09-1.38.69-1.98 1c-1.69.87-3.68 1.06-5.44.24c-1.15-.53-1.27-1.25-1.48-2.29c-.08-.40-.18-.79-.15-1.20c.03-.44.12-.86.06-1.30c-.62-.07-1.30-.01-1.94-.01c-.55.01-1.09.13-1.61.18" />
          {/* Nose center */}
          <Ellipse cx="59.04" cy="86.68" fill="#2f2f2f" rx="5.25" ry="6.33" />
          {/* Whiskers - right */}
          <Path fill="#78a3ad" d="M16.33 82.98c.13-.87.90-1.46 1.74-1.34l6.51 1.01l.08 3.23l-7.04-1.09c-.84-.14-1.42-.94-1.29-1.81m11.80 13.75l1.20 2.83l-8.01 2.64c-.15.05-.31.07-.46.07c-.65 0-1.25-.43-1.46-1.11c-.25-.84.19-1.73 1-2l7.19-2.37m-1.73-4.12l-7.60 1.43c-.09.02-.19.03-.28.03c-.73 0-1.37-.54-1.50-1.31c-.15-.86.40-1.69 1.24-1.85l7.39-1.39l1.25 2.96" />
        </Svg>

        {/* Left Eye - Animated blink */}
        <Animated.View
          style={[
            styles.eyeContainer,
            { left: 40 * scale, top: 74 * scale, width: 10 * scale, height: 12 * scale },
            eyeAnimatedStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="40 74 10 12">
            <Ellipse cx="44.85" cy="79.69" fill="#2f2f2f" rx="4.67" ry="5.65" />
          </Svg>
        </Animated.View>

        {/* Right Eye - Animated blink */}
        <Animated.View
          style={[
            styles.eyeContainer,
            { left: 79 * scale, top: 74 * scale, width: 10 * scale, height: 12 * scale },
            eyeAnimatedStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="79 74 10 12">
            <Ellipse cx="83.71" cy="79.69" fill="#2f2f2f" rx="4.68" ry="5.64" />
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

export default AnimatedMouse;
