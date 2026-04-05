import React, { useEffect } from 'react';
import { View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeFeed } from '@/components/screens/home/home-feed';
import { useAgentsActions } from '@/providers';
import { homeStyles } from '@/lib/styles/screens/tabs/home.styles';
import { useScreenAnimation } from '@/hooks/useScreenAnimation';
import { logger } from '@/lib/utils/logger';

export default function HomeScreen() {
  const { loadFromStorage, fetchAgents } = useAgentsActions();
  const insets = useSafeAreaInsets();

  // Use unified screen animation hook
  const { animatedStyle } = useScreenAnimation();

  // Initialize agents when home screen mounts (only when authenticated)
  useEffect(() => {
    const initializeAgents = async () => {
      try {
        // First load from storage
        await loadFromStorage();
        // Then fetch fresh data in background
        fetchAgents();
      } catch (error) {
        logger.warn('Failed to initialize agents:', error);
      }
    };

    initializeAgents();
  }, []);

  return (
    <Animated.View style={[homeStyles.container, animatedStyle]}>
      <HomeFeed topInset={insets.top} />
    </Animated.View>
  );
}
