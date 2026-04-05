import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/lib/styles/core/tokens';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/Theme';
import { TimeTheme } from '@/lib/utils/time-theme';

interface QuestTaskIntroProps {
  task: {
    title: string;
    description: string;
    framework: string;
    questions: any[];
  };
  taskNumber: number;
  totalTasks: number;
  onStart: () => void;
  isLoading?: boolean;
  theme?: TimeTheme;
}

export const QuestTaskIntro: React.FC<QuestTaskIntroProps> = ({
  task,
  taskNumber,
  totalTasks,
  onStart,
  isLoading = false,
  theme,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Task gradients based on theme
  const taskGradients = theme ? [
    theme.quest.taskGradient1,
    theme.quest.taskGradient2,
    theme.quest.taskGradient3,
  ] : [
    ['#E9D5FF', '#DDD6FE'] as const,
    ['#BFDBFE', '#DBEAFE'] as const,
    ['#A7F3D0', '#D1FAE5'] as const,
  ];
  const taskGradient = taskGradients[(taskNumber - 1) % taskGradients.length];

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Badge bounce animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 100,
        friction: 5,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }),
    ]).start();

    // Card slide animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [taskNumber]);

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={theme?.quest.gradientColors || ['#F0F4FF', '#FFFFFF', '#FFF7F0']}
        locations={[0, 0.5, 1]}
        style={styles.backgroundGradient}
      />

      {/* Floating Decorative Elements */}
      <View style={[styles.floatingCircle1, theme && { backgroundColor: theme.quest.floatingCircle1 }]} />
      <View style={[styles.floatingCircle2, theme && { backgroundColor: theme.quest.floatingCircle2 }]} />

      {/* Main Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Task Badge */}
        <View style={styles.badgeContainer}>
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
            }}
          >
            <LinearGradient
              colors={taskGradient as [string, string]}
              style={styles.taskBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.taskBadgeText, theme && { color: theme.quest.text }]}>
                {taskNumber} / {totalTasks}
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, theme && { color: theme.quest.text }]}>
            {taskNumber === 1 ? "Let's Explore" : taskNumber === 2 ? 'Dive Deeper Into' : 'Complete'}
            {'\n'}
            {task.title}
          </Text>
          <Text style={[styles.description, theme && { color: theme.quest.textSecondary }]}>{task.description}</Text>
        </View>

        {/* Main Card */}
        <View style={[styles.mainCard, theme && { backgroundColor: theme.quest.cardBackground, borderColor: theme.quest.cardBorder }]}>
          {/* Stats */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.statsContainer}>
              <View style={[styles.statBadge, theme && { backgroundColor: theme.quest.statBadgeBackground }]}>
                <Text style={styles.statIcon}>📝</Text>
                <Text style={[styles.statBadgeText, theme && { color: theme.quest.statBadgeText }]}>{task.questions.length} Questions</Text>
              </View>
              <View style={[styles.statBadge, theme && { backgroundColor: theme.quest.statBadgeBackground }]}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={[styles.statBadgeText, theme && { color: theme.quest.statBadgeText }]}>~{Math.ceil(task.questions.length * 0.5)} mins</Text>
              </View>
            </View>
          </Animated.View>

          {/* Info Note */}
          <View style={[styles.infoNote, theme && { borderTopColor: theme.quest.infoNoteBorder }]}>
            <View style={styles.lockIcon}>
              <Text style={styles.lockIconText}>💡</Text>
            </View>
            <Text style={[styles.infoText, theme && { color: theme.quest.infoNoteText }]}>Answer honestly for the best insights</Text>
          </View>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.backButtonFooter, theme && { backgroundColor: theme.quest.backButtonBackground, borderColor: theme.quest.backButtonBorder }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={theme?.quest.backButtonIcon || '#1F2937'} />
          </TouchableOpacity>

          <Button
            variant="primary"
            size="lg"
            onPress={onStart}
            loading={isLoading}
            disabled={isLoading}
            style={styles.primaryButton}
            backgroundColor={theme?.quest.primaryButtonBackground}
            textColor={theme?.quest.primaryButtonText}
          >
            Start Task
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Background
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },

  // Floating Decorative Elements
  floatingCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(90, 134, 255, 0.08)',
    top: -50,
    right: -80,
  },
  floatingCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(110, 215, 196, 0.08)',
    bottom: 100,
    left: -60,
  },

  // Main Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: 'space-between',
  },

  // Badge
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  taskBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  taskBadgeText: {
    fontSize: 28,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    letterSpacing: -0.5,
  },

  // Title
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 32,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  // Main Card
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    marginBottom: 24,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  statIcon: {
    fontSize: 16,
  },
  statBadgeText: {
    fontSize: 13,
    fontFamily: 'SFProDisplaySemibold',
    color: '#1F2937',
    letterSpacing: -0.2,
  },

  // Info Note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  lockIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIconText: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'SFProDisplayMedium',
    color: '#6B7280',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButtonFooter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  primaryButton: {
    flex: 1,
  },
});
