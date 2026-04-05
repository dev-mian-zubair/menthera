import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/lib/styles/core/tokens';
import { Colors } from '@/constants/Theme';
import { TimeTheme } from '@/lib/utils/time-theme';

interface QuestProgressProps {
  current: number;
  total: number;
  theme?: TimeTheme;
}

export const QuestProgress: React.FC<QuestProgressProps> = ({
  current,
  total,
  theme,
}) => {
  const insets = useSafeAreaInsets();
  const percentage = (current / total) * 100;
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={[styles.container, { marginTop: Math.max(insets.top, 8) }]}>
      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, theme && { color: theme.quest.text }]}>
            Question {current} of {total}
          </Text>
          <Text style={[styles.statsText, theme && { color: theme.quest.text }]}>
            {Math.round(percentage)}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBar, theme && { backgroundColor: theme.quest.progressBarBackground }]}>
          <Animated.View
            style={[
              styles.progressFill,
              theme && { backgroundColor: theme.quest.progressBarFill },
              {
                width: animatedWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })
              }
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.lg,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
  },
  progressCard: {
    borderRadius: 28,
    padding: 12,
    backgroundColor: 'transparent',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
    backgroundColor: 'transparent',
  },
  statsText: {
    fontSize: 12,
    fontFamily: 'SFProDisplaySemibold',
    color: '#1F2937',
    opacity: 0.8,
    letterSpacing: -0.2,
  },
  progressBar: {
    height: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9,
    backgroundColor: tokens.colors.brand.serenityBlue,
  },
});
