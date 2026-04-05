import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { QuestDefinition, QuestTaskWithQuestions } from '@/lib/api';
import { JourneyPath } from './JourneyPath';
import { useAgentsState } from '@/providers';
import { TimeTheme } from '@/lib/utils/time-theme';

interface QuestIntroProps {
  questDefinition: QuestDefinition;
  tasks?: QuestTaskWithQuestions[];
  onStart: () => void;
  isLoading?: boolean;
  questStatus?: 'not_started' | 'in_progress' | 'completed';
  agentId?: string;
  theme?: TimeTheme;
}

export const QuestIntro: React.FC<QuestIntroProps> = ({
  questDefinition,
  tasks = [],
  onStart,
  isLoading = false,
  questStatus = 'not_started',
  agentId,
  theme,
}) => {
  const router = useRouter();
  const { agents } = useAgentsState();
  const agent = agentId ? agents.find(a => a.id === agentId) : null;
  const insets = useSafeAreaInsets();

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

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(tasks.map(() => new Animated.Value(30))).current;

  useEffect(() => {
    // Fade in main content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Stagger task card animations
    Animated.stagger(
      100,
      slideAnims.map(slideAnim =>
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      )
    ).start();
  }, []);

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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.badge, theme && { backgroundColor: theme.quest.badgeBackground }]}>
            <Text style={[styles.badgeText, theme && { color: theme.quest.badgeText }]}>{agent?.name || 'Your Coach'}</Text>
          </View>

          <Text style={[styles.heroTitle, theme && { color: theme.quest.text }]}>
            Your Personalization{'\n'}Journey Starts Here
          </Text>

          <Text style={[styles.heroSubtitle, theme && { color: theme.quest.textSecondary }]}>
            Answer a few quick questions to unlock a truly personalized experience
          </Text>
        </View>

        {/* Main Card */}
        <View style={[styles.mainCard, theme && { backgroundColor: theme.quest.cardBackground, borderColor: theme.quest.cardBorder }]}>
          {/* Progress Header */}
          <View style={styles.cardHeader}>
            <View style={styles.progressDots}>
              {Array.from({ length: tasks.length }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    theme && { backgroundColor: theme.quest.progressDot },
                    i === 0 && [styles.progressDotActive, theme && { backgroundColor: theme.quest.progressDotActive }]
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.cardHeaderText, theme && { color: theme.quest.textSecondary }]}>
              {tasks.length} quick tasks • {questDefinition.estimatedTimeMinutes} min
            </Text>
          </View>

          {/* Tasks */}
          <View style={styles.tasksList}>
            {tasks.map((task, index) => (
              <Animated.View
                key={task.taskId}
                style={{
                  transform: [{ translateY: slideAnims[index] }],
                  opacity: fadeAnim,
                }}
              >
                <View style={styles.taskItem}>
                  <View style={styles.taskIconContainer}>
                    <LinearGradient
                      colors={taskGradients[index % taskGradients.length] as [string, string]}
                      style={styles.taskIcon}
                    >
                      <Text style={[styles.taskIconText, theme && { color: theme.quest.text }]}>{index + 1}</Text>
                    </LinearGradient>
                  </View>

                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, theme && { color: theme.quest.text }]}>{task.title}</Text>
                    <Text style={[styles.taskSubtitle, theme && { color: theme.quest.textMuted }]}>
                      {task.questions.length} questions
                    </Text>
                  </View>

                  <View style={[styles.taskCheckbox, theme && { borderColor: theme.quest.optionUnselectedBorder, backgroundColor: theme.quest.optionCardBackground }]} />
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Privacy Note */}
          <View style={[styles.privacyNote, theme && { borderTopColor: theme.quest.infoNoteBorder }]}>
            <View style={styles.lockIcon}>
              <Text style={styles.lockIconText}>🔒</Text>
            </View>
            <Text style={[styles.privacyText, theme && { color: theme.quest.textSecondary }]}>
              Your responses are private and secure
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Footer Button */}
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
            {questStatus === 'in_progress' ? 'Continue Quest' : 'Begin Quest'}
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

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badge: {
    backgroundColor: 'rgba(90, 134, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: 'SFProDisplaySemibold',
    color: '#5A86FF',
    letterSpacing: -0.2,
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 38,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'SFProDisplayRegular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
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

  // Progress Header
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#5A86FF',
    width: 24,
  },
  cardHeaderText: {
    fontSize: 13,
    fontFamily: 'SFProDisplayMedium',
    color: '#6B7280',
    letterSpacing: -0.2,
  },

  // Tasks List
  tasksList: {
    gap: 12,
    marginBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIconText: {
    fontSize: 16,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontFamily: 'SFProDisplaySemibold',
    color: '#1F2937',
    marginBottom: 2,
  },
  taskSubtitle: {
    fontSize: 13,
    fontFamily: 'SFProDisplayRegular',
    color: '#9CA3AF',
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },

  // Privacy Note
  privacyNote: {
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
  privacyText: {
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
