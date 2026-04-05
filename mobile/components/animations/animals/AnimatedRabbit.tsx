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

interface AnimatedRabbitProps {
  size?: number;
  isActive?: boolean;
  audioLevel?: number;
}

export const AnimatedRabbit: React.FC<AnimatedRabbitProps> = ({
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
          {/* Pink body and ears */}
          <Path fill="#f6d2d2" d="M85.87 63.89s2.97 3.44 4.15 9.25c1.92 9.51 5.01 16.36 5.90 21.84c1.17 7.29.20 15.04-5.33 20.28c-8.47 8.04-20.46 11.18-31.98 11.50c-.56.02-1.13.02-1.71.02c-14.89 0-37.80-5.25-42.75-21.09c-1.46-4.66-.96-11.72 1.02-16.19c2.46-5.55 3.46-12.47 6.12-18.53c1.73-3.95 4.12-7.62 7.32-10.53c.53-.48 1.96-1.21 2.27-1.81c.29-.58.06-1.96.10-2.73c.92-17.35 1.43-43.59 19.42-52.94c2.17-1.13 4.69-1.77 7.04-1.77c4.35 0 8.18 2.20 8.43 7.57c.74 16.15-14.46 29.97-12.28 46.14c.03.26 3.56.56 3.94.58c1.07.07 2.14.12 3.21.14c.36.01 1.16.08 1.91.08c.66 0 1.28-.06 1.52-.29c2.15-2.11 3.02-7.73 4.22-10.49c1.70-3.95 3.67-7.78 5.95-11.43c4.52-7.26 10.35-13.83 17.77-18.24c2.79-1.65 6.03-2.79 9.25-3.21c.53-.07 1.11-.10 1.76-.10c3.18 0 7.42.89 9.37 3c6.54 7.08-2.73 18.41-7.20 23.87c-4.33 5.30-8.92 10.38-13.33 15.62c-2.22 2.59-6.07 5.77-6.09 9.46" />
          {/* Mouth area */}
          <Path fill="#2f2f2f" d="M67.62 113.08c-1.94-.99-3.85 1.90-5.68 2.12c-2.13.25-4.07-.70-4.37-1.74c-.12-.39-.25-1.94-.28-2.28c2.87-1.15 4.30-3.25 4.28-4.37c0-.75-.36-1.45-1.07-1.53c-.76-.09-1.25.31-1.84.73c-1.44 1.02-2.03 1.57-4.33 1.55c-1.55-.01-2.78-.78-3.71-1.60c-.42-.36-1.39-1-2.17-.31c-1.70 1.51 1.02 4.24 2.46 4.88c.65.29 1.20.56 1.81.79c0 .93-.01 1.86-.03 2.02c-.10 1.21-1.36 1.81-2.47 2.09c-.94.23-2.28.06-3.17-.31c-.82-.33-1.34-1.15-1.91-1.77c-.60-.65-1.34-.93-2.04-.58c-1.14.57-1.24 1.96-.57 3.28c.83 1.61 1.82 2.21 2.91 2.82c1.50.85 4.96 1.11 7.22.08c1.86-.85 2.50-1.97 3.84-.94c1.83 1.39 4.45 1.55 6.79.96c1.98-.52 6.97-4.54 4.33-5.89" />
          {/* Ear inner pink */}
          <Path fill="#ed80ad" d="M101.08 23.97C90.81 24 81.91 34.45 77.34 42.58c-2.06 3.66-3.89 7.83-4.58 11.98c-.48 2.88-.02 5.82 3.25 6.50c1.49.31 2.71-.23 3.74-1.13c1.44-1.28 2.53-3.30 3.50-4.72c2.74-4.04 5.21-8 8.49-11.66c2.59-2.88 4.91-5.77 7.70-8.48c2.47-2.41 5.80-5.59 4.87-9.42c-.32-1.27-2.13-1.68-3.23-1.68M45.96 55.56c.55-2.01.68-4.48.72-6.50c.11-8.50 4.98-17.12 7.97-24.87c1.10-2.85 4.18-11.87-2.14-10.38c-4.97 1.19-9.14 7.33-11.03 11.69c-2.08 4.78-3.29 9.98-3.87 15.16c-.29 2.59-.31 5.20-.19 7.81c.11 2.38-.05 5.26.87 7.49c.65 1.58 1.86 1.93 3.52 1.77c1.35-.13 3.10-.35 3.87-1.51c.12-.20.22-.42.28-.66" />
        </Svg>

        {/* Left Eye - Animated blink */}
        <Animated.View
          style={[
            styles.eyeContainer,
            { left: 29 * scale, top: 81.5 * scale, width: 12 * scale, height: 14 * scale },
            eyeAnimatedStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="29 81.5 12 14">
            <Ellipse cx="34.82" cy="88.19" fill="#2f2f2f" rx="5.68" ry="6.61" />
          </Svg>
        </Animated.View>

        {/* Right Eye - Animated blink */}
        <Animated.View
          style={[
            styles.eyeContainer,
            { left: 66 * scale, top: 81.5 * scale, width: 12 * scale, height: 14 * scale },
            eyeAnimatedStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="66 81.5 12 14">
            <Ellipse cx="72.75" cy="88.19" fill="#2f2f2f" rx="5.63" ry="6.64" />
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

export default AnimatedRabbit;
