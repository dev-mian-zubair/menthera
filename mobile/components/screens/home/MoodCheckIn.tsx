/**
 * MoodCheckIn - Dismissible Mood Selector
 *
 * A glassmorphic card that allows users to quickly log their current mood
 * with 5 emoji options. Includes dismiss functionality with smooth animation.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { GlassCard } from '@/components/common/GlassCard';
import { TimeTheme } from '@/lib/utils/time-theme';
import { logger } from '@/lib/utils/logger';

const MOOD_DISMISSED_KEY = '@menthera/mood_check_in_dismissed';
const MOOD_DISMISSED_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface MoodOption {
  emoji: string;
  label: string;
  value: 'great' | 'good' | 'okay' | 'low' | 'struggling';
}

const moodOptions: MoodOption[] = [
  { emoji: '😊', label: 'Great', value: 'great' },
  { emoji: '🙂', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😔', label: 'Low', value: 'low' },
  { emoji: '😫', label: 'Struggling', value: 'struggling' },
];

interface MoodCheckInProps {
  /** Theme for styling */
  theme: TimeTheme;
  /** Callback when a mood is selected */
  onMoodSelect?: (mood: MoodOption['value']) => void;
  /** Callback when the card is dismissed */
  onDismiss?: () => void;
}

export const MoodCheckIn: React.FC<MoodCheckInProps> = ({
  theme,
  onMoodSelect,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodOption['value'] | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Re-check dismissal status every time the home tab gains focus
  useFocusEffect(
    useCallback(() => {
      const checkDismissed = async () => {
        try {
          const dismissedAt = await AsyncStorage.getItem(MOOD_DISMISSED_KEY);
          if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const now = Date.now();
            if (now - dismissedTime < MOOD_DISMISSED_EXPIRY) {
              const remainingMs = MOOD_DISMISSED_EXPIRY - (now - dismissedTime);
              const remainingMin = Math.ceil(remainingMs / 60000);
              logger.debug(`[MoodCheckIn] Will reappear in ${remainingMin} minutes (${(remainingMin / 60).toFixed(1)} hours)`);
              return;
            }
          }
          // Show the mood check-in with animation
          setIsVisible(true);
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
        } catch (error) {
          // On error, show the component anyway
          setIsVisible(true);
          fadeAnim.setValue(1);
          scaleAnim.setValue(1);
        }
      };

      checkDismissed();
    }, [])
  );

  const handleDismiss = async () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      setIsVisible(false);
      // Store dismiss time
      try {
        await AsyncStorage.setItem(MOOD_DISMISSED_KEY, Date.now().toString());
      } catch (error) {
        logger.debug('[MoodCheckIn] Error saving dismiss time:', error);
      }
      onDismiss?.();
    });
  };

  const handleMoodSelect = (mood: MoodOption) => {
    setSelectedMood(mood.value);
    onMoodSelect?.(mood.value);

    // Brief highlight then dismiss
    setTimeout(() => {
      handleDismiss();
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <GlassCard
        backgroundColor={theme.glass.cardBackground}
        borderColor={theme.glass.cardBorder}
        shadowColor={theme.glass.cardShadow}
        borderRadius={20}
        padding={16}
      >
        {/* Header with dismiss button */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textColor }]}>
            How are you feeling today?
          </Text>
          <TouchableOpacity
            style={[styles.dismissButton, { backgroundColor: theme.glass.cardBorder }]}
            onPress={handleDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color={theme.subtitleColor} />
          </TouchableOpacity>
        </View>

        {/* Mood options */}
        <View style={styles.moodContainer}>
          {moodOptions.map((mood) => (
            <TouchableOpacity
              key={mood.value}
              style={[
                styles.moodOption,
                selectedMood === mood.value && styles.moodOptionSelected,
                selectedMood === mood.value && { backgroundColor: theme.sectionLinkColor + '20' },
              ]}
              onPress={() => handleMoodSelect(mood)}
              activeOpacity={0.7}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  { color: theme.subtitleColor },
                  selectedMood === mood.value && { color: theme.sectionLinkColor },
                ]}
              >
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'SFProDisplaySemibold',
    letterSpacing: -0.2,
    flex: 1,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  moodOptionSelected: {
    transform: [{ scale: 1.05 }],
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    fontFamily: 'SFProDisplayMedium',
    textAlign: 'center',
  },
});

export default MoodCheckIn;
