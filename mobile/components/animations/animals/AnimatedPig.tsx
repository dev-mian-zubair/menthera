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

interface AnimatedPigProps {
  size?: number;
  isActive?: boolean;
  audioLevel?: number;
}

export const AnimatedPig: React.FC<AnimatedPigProps> = ({
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
          {/* Dark ears */}
          <Path fill="#855c52" d="M92.37 12.46s11.27 5.19 18.20 13.52c6.94 8.32 7.74 10.54 8.86 13.04l.86 6.84l-12.95 6.63l-21.27-6.32S74.51 23.66 74.35 23.20c-.15-.46 3.55-8.94 3.55-8.94zM8.20 39.48s3.11-5.95 9.58-13.05c4.41-4.84 14.89-12.69 17.26-13.68l9.72 6.29l-5.86 24.67l-21.28 14.17z" />
          {/* Pink skin */}
          <Path fill="#fcd4b5" d="M127.22 64.71c-.17-.87-.35-1.72-.52-2.56c-1.68-7.98-3.89-15.90-7.28-23.14c-1.79 2.36-4.18 4.25-7.03 5.33l-.29.11c-1.89.74-3.89 1.46-5.77 1.46c-.79 0-1.55-.13-2.23-.38c-2.91-1.06-4.49-3.33-4.69-6.75l-.01-.25c-.82-3.58-1.93-6.73-3.20-9.13c-.36-.67-.87-1.44-1.40-2.25c-1.48-2.25-3.32-5.04-3.70-8.42c-.21-1.80.27-4.12 1.27-6.30c-8.68-3.73-18.56-5.65-28.33-5.64c-10.04-.02-20.18 2.02-29 5.93c.90 2.10 1.32 4.28 1.13 6c-.39 3.39-2.23 6.18-3.71 8.42c-.54.82-1.04 1.58-1.39 2.25c-1.28 2.38-2.39 5.55-3.19 9.03l-.03.34c-.19 3.42-1.77 5.70-4.68 6.76c-.69.26-1.45.38-2.24.38c-1.90 0-4-.76-5.82-1.48l-.25-.09c-2.65-1.01-4.90-2.73-6.65-4.87c-3.03 6.42-5.11 13.36-6.37 20.39c-.28 1.57-.59 3.17-.91 4.81l-.01.04l-.04.20c-.70 3.64-9.45 55.97 62.13 56.27c.30 0 .61.01.92.01c.87 0 1.68-.04 2.53-.06c4-.10 7.99-.38 11.97-.79c58.03-6.98 48.92-55.01 48.79-55.62" />
          {/* Smile/chin */}
          <Path fill="#2f2f2f" d="M72.48 96.38c-4.09 12.39-13.08 12.59-17.68 1.24c-.80-1.97-1.25-3.75-1.49-5.40c3.56 1.08 7.03 1.41 9.85 1.41c3.52 0 7.03-.54 10.34-1.47c-.20 1.29-.50 2.65-1.02 4.22" />
          {/* Ear inner pink */}
          <Path fill="#fcd4b5" d="M100.80 26.97c1.71 3.20 2.89 6.96 3.68 10.42c.32 1.35-.21 2.66 1.40 3.25l.45.07c1.20 0 3.47-.95 4.21-1.24c2.78-1.06 4.87-3.21 6.07-5.79c1.20-2.59 1.52-5.60.73-8.36c-.09-.31-.19-.61-.31-.92c-1.69-4.35-6.02-8.43-9.80-10.93c-1.52-1-3.86-2.62-5.89-2.62c-.25 0-.49.02-.73.07c-1.41.31-2.75 2-3.57 3.79c-.57 1.23-.89 2.51-.78 3.43c.37 3.15 3.03 6.01 4.54 8.83m-84.10 12.50c.73.29 3.01 1.24 4.21 1.24l.45-.07c1.61-.59 1.08-1.90 1.39-3.25c.79-3.46 1.98-7.22 3.69-10.42c1.51-2.82 4.17-5.69 4.52-8.81c.10-.83-.15-1.96-.61-3.07c-.79-1.93-2.24-3.82-3.74-4.16c-.23-.05-.48-.07-.72-.07c-2.03 0-4.37 1.62-5.89 2.62c-3.78 2.51-8.12 6.58-9.80 10.93c-.12.31-.22.61-.31.92c-.86 2.97-.39 6.22 1.06 8.93c1.24 2.31 3.19 4.24 5.75 5.21" />
          {/* Orange snout */}
          <Path fill="#f79329" d="M46.44 71.48c.22-.27.45-.54.69-.78c3.84-4.15 8.72-5.52 14.38-5.81c.41-.02.83-.03 1.25-.03c6.96 0 15.48 2.88 19 9.24c3.23 5.87 2.91 16.25-4.54 19.01c-1.44.53-3.03.95-4.66 1.31c-2.98.65-6.19 1.04-9.44 1.04c-3 0-6.01-.31-8.81-.98c-2.79-.67-5.38-1.71-7.55-3.15c-6.67-4.43-4.64-14.56-.32-19.85" />
          {/* Nostrils */}
          <Ellipse cx="55.77" cy="80.55" fill="#2f2f2f" rx="3.41" ry="7.57" />
          <Ellipse cx="70.66" cy="80.12" fill="#2f2f2f" rx="3.42" ry="7.58" />
        </Svg>

        {/* Left Eye - Animated blink */}
        <Animated.View
          style={[
            styles.eyeContainer,
            { left: 27.5 * scale, top: 56 * scale, width: 14 * scale, height: 17 * scale },
            eyeAnimatedStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="27.5 56 14 17">
            <Ellipse cx="34.53" cy="64.47" fill="#2f2f2f" rx="6.85" ry="8.11" />
          </Svg>
        </Animated.View>

        {/* Right Eye - Animated blink */}
        <Animated.View
          style={[
            styles.eyeContainer,
            { left: 86.5 * scale, top: 56 * scale, width: 14 * scale, height: 17 * scale },
            eyeAnimatedStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="86.5 56 14 17">
            <Ellipse cx="93.60" cy="64.47" fill="#2f2f2f" rx="6.80" ry="8.21" />
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

export default AnimatedPig;
