import React, { useEffect, useMemo } from 'react';
import { View, Image, Text, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/lib/styles/core/tokens';
import { getTimeTheme } from '@/lib/utils/time-theme';

interface SplashScreenProps {
  isReady: boolean;
}

export const MentheraSplashScreen: React.FC<SplashScreenProps> = ({ isReady }) => {
  const insets = useSafeAreaInsets();
  const theme = useMemo(() => getTimeTheme(), []);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: insets.bottom,
      }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Image
          source={require('@/assets/images/logo.png')}
          style={{
            width: 120,
            height: 120,
            marginBottom: 24,
            borderRadius: 24,
          }}
          resizeMode="contain"
        />

        <Text
          style={{
            fontSize: tokens.typography.sizes['2xl'],
            fontWeight: '700',
            color: theme.textColor,
            marginBottom: 8,
            letterSpacing: 0.5,
          }}
        >
          Menthera
        </Text>

        <Text
          style={{
            fontSize: tokens.typography.sizes.sm,
            color: theme.subtitleColor,
            letterSpacing: 0.3,
            marginBottom: 32,
          }}
        >
          AI Coach
        </Text>

        <ActivityIndicator
          size="small"
          color={theme.subtitleColor}
          style={{ marginTop: 16 }}
        />
      </Animated.View>
    </View>
  );
};
