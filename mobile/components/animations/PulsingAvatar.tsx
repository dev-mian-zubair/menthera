import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Avatar } from '@/components/common/Avatar';
import { AnimatedAnimalAvatar, hasAnimatedVersion } from './AnimatedAnimalAvatar';
import { isSvgAvatar } from '@/lib/utils/avatar-utils';

interface PulsingAvatarProps {
  avatar: string;
  size: number;
  isActive: boolean;
  audioLevel?: number;
  glowColor?: string;
}

export const PulsingAvatar: React.FC<PulsingAvatarProps> = ({
  avatar,
  size,
  isActive,
  audioLevel = 0,
  glowColor = '#2C2C2C',
}) => {
  const breatheScale = useSharedValue(1);

  React.useEffect(() => {
    if (isActive) {
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(1.0, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        ),
        -1,
        true,
      );
    } else {
      breatheScale.value = withSpring(1, { damping: 15 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }],
  }));

  const useAnimatedAvatar = isSvgAvatar(avatar) && hasAnimatedVersion(avatar);

  return (
    <View style={styles.container}>
      {useAnimatedAvatar ? (
        <AnimatedAnimalAvatar
          avatar={avatar}
          size={size}
          isActive={isActive}
          audioLevel={audioLevel}
        />
      ) : (
        <Animated.View
          style={[
            {
              overflow: 'hidden',
              borderRadius: size / 2,
            },
            animatedStyle,
          ]}
        >
          <Avatar avatar={avatar} size={size} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
