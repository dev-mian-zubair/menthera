import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/lib/styles/core/tokens';
import { Button } from '@/components/ui/button';
import { QuestQuestion } from '@/lib/api';
import { Colors } from '@/constants/Theme';
import { ConfettiParticle } from './ConfettiParticle';
import { TimeTheme } from '@/lib/utils/time-theme';

interface QuestTaskReviewProps {
  task: {
    title: string;
    questions: QuestQuestion[];
  };
  answers: Map<string, number>;
  onEdit: (questionIndex: number) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  theme?: TimeTheme;
}

const LIKERT_SCALE = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Somewhat Disagree' },
  { value: 4, label: 'Neutral' },
  { value: 5, label: 'Somewhat Agree' },
  { value: 6, label: 'Agree' },
  { value: 7, label: 'Strongly Agree' },
];

export const QuestTaskReview: React.FC<QuestTaskReviewProps> = ({
  task,
  answers,
  onEdit,
  onSubmit,
  isLoading = false,
  theme,
}) => {
  const insets = useSafeAreaInsets();
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasTriggeredCelebration, setHasTriggeredCelebration] = useState(false);

  const allAnswered = task.questions.every((q) => answers.has(q.questionId));
  const answeredCount = task.questions.filter((q) => answers.has(q.questionId)).length;
  const completionPercentage = (answeredCount / task.questions.length) * 100;

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const trophyScale = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (allAnswered && !hasTriggeredCelebration) {
      // Trigger celebration
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Haptics not available
      }
      setShowConfetti(true);
      setHasTriggeredCelebration(true);
      setTimeout(() => setShowConfetti(false), 2000);

      // Trophy bounce animation
      Animated.sequence([
        Animated.spring(trophyScale, {
          toValue: 1.2,
          tension: 100,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(trophyScale, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [allAnswered, hasTriggeredCelebration]);

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

      {/* Confetti */}
      <ConfettiParticle active={showConfetti} intensity="medium" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 16) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Creative Animated Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {allAnswered ? (
            <View style={styles.celebrationHeader}>
              <Animated.View style={{ transform: [{ scale: trophyScale }] }}>
                <LinearGradient
                  colors={theme?.quest.celebrationBadgeGradient || ['#10B981', '#059669']}
                  style={styles.celebrationBadge}
                >
                  <Ionicons name="checkmark-circle" size={42} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
              <Text style={[styles.celebrationTitle, theme && { color: theme.quest.text }]}>All Done! 🎉</Text>
              <Text style={[styles.celebrationSubtitle, theme && { color: theme.quest.textSecondary }]}>
                Ready to submit your {task.questions.length} answers
              </Text>
            </View>
          ) : (
            <View style={styles.progressHeader}>
              <View style={styles.headerRow}>
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.title, theme && { color: theme.quest.text }]}>Almost There! 💪</Text>
                  <Text style={[styles.subtitle, theme && { color: theme.quest.textSecondary }]}>
                    {answeredCount} of {task.questions.length} answered
                  </Text>
                </View>

                {/* Circular Progress Ring */}
                <View style={[styles.progressRing, theme && { backgroundColor: `${theme.quest.progressBarFill}26`, borderColor: theme.quest.progressBarFill }]}>
                  <View style={styles.progressRingInner}>
                    <Text style={[styles.progressPercentageText, theme && { color: theme.quest.progressBarFill }]}>
                      {answeredCount}
                    </Text>
                    <Text style={[styles.progressTotalText, theme && { color: theme.quest.progressBarFill }]}>
                      /{task.questions.length}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Visual Progress Bar */}
              <View style={[styles.progressBarContainer, theme && { backgroundColor: `${theme.quest.progressBarFill}26` }]}>
                <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }, theme && { backgroundColor: theme.quest.progressBarFill }]} />
              </View>
            </View>
          )}
        </Animated.View>

        {/* Creative Question Cards */}
        <View style={styles.questionsList}>
          {task.questions.map((question, index) => {
            const value = answers.get(question.questionId);
            const answerLabel = value ? LIKERT_SCALE[value - 1].label : 'Tap to answer';
            const isAnswered = value !== undefined;

            return (
              <Pressable
                key={question.questionId}
                onPress={() => onEdit(index)}
                style={({ pressed }) => [
                  pressed && styles.reviewCardPressed,
                ]}
              >
                {isAnswered ? (
                  <LinearGradient
                    colors={theme?.quest.answeredCardGradient || ['rgba(90, 134, 255, 0.12)', 'rgba(90, 134, 255, 0.06)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.reviewCardGradient, theme && { borderColor: theme.quest.answeredCardBorder }]}
                  >
                    {/* Green Check Badge */}
                    <View style={styles.statusBadgeAnswered}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.questionRow}>
                        <View style={[styles.questionNumberBadgeAnswered, theme && { backgroundColor: theme.quest.questionNumberBadgeBackground }]}>
                          <Text style={[styles.questionNumberTextAnswered, theme && { color: theme.quest.questionNumberBadgeText }]}>{index + 1}</Text>
                        </View>
                        <Text style={[styles.questionTextAnswered, theme && { color: theme.quest.text }]} numberOfLines={2}>
                          {question.text}
                        </Text>
                      </View>

                      <View style={[styles.answerPill, theme && { backgroundColor: theme.quest.answerPillBackground }]}>
                        <Ionicons name="checkmark-circle" size={14} color={theme?.quest.answerPillText || '#5A86FF'} />
                        <Text style={[styles.answerPillText, theme && { color: theme.quest.answerPillText }]} numberOfLines={1}>
                          {answerLabel}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={[styles.reviewCardEmpty, theme && { backgroundColor: theme.quest.emptyCardBackground, borderColor: theme.quest.emptyCardBorder }]}>
                    {/* Gray Circle Badge */}
                    <View style={styles.statusBadgeUnanswered}>
                      <Ionicons name="ellipse-outline" size={20} color={theme?.quest.emptyNumberBadgeText || '#9CA3AF'} />
                    </View>

                    <View style={styles.cardContent}>
                      <View style={styles.questionRow}>
                        <View style={[styles.questionNumberBadgeEmpty, theme && { backgroundColor: theme.quest.emptyNumberBadgeBackground }]}>
                          <Text style={[styles.questionNumberTextEmpty, theme && { color: theme.quest.emptyNumberBadgeText }]}>{index + 1}</Text>
                        </View>
                        <Text style={[styles.questionTextEmpty, theme && { color: theme.quest.textSecondary }]} numberOfLines={2}>
                          {question.text}
                        </Text>
                      </View>

                      <View style={[styles.emptyStatePill, theme && { backgroundColor: theme.quest.emptyPillBackground, borderColor: theme.quest.emptyPillBorder }]}>
                        <Ionicons name="create-outline" size={14} color={theme?.quest.emptyPillText || '#D1D5DB'} />
                        <Text style={[styles.emptyStateText, theme && { color: theme.quest.emptyPillText }]}>Tap to answer</Text>
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {!allAnswered && (
          <View style={[styles.warningBanner, theme && { backgroundColor: theme.quest.warningBannerBackground, borderColor: theme.quest.warningBannerBorder }]}>
            <Ionicons name="information-circle-outline" size={16} color={theme?.quest.warningBannerIcon || '#D97706'} />
            <Text style={[styles.warningText, theme && { color: theme.quest.warningBannerText }]}>
              Complete all questions to continue
            </Text>
          </View>
        )}
        <Button
          variant="primary"
          size="lg"
          onPress={onSubmit}
          disabled={!allAnswered || isLoading}
          loading={isLoading}
          fullWidth
          style={styles.submitButton}
          backgroundColor={theme?.quest.primaryButtonBackground}
          textColor={theme?.quest.primaryButtonText}
        >
          Submit Task
        </Button>
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
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(90, 134, 255, 0.06)',
    top: -40,
    right: -60,
  },
  floatingCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(110, 215, 196, 0.06)',
    bottom: 120,
    left: -50,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  // Header
  header: {
    marginBottom: 24,
  },

  // Celebration Header
  celebrationHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  celebrationBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrationTitle: {
    fontSize: 32,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    letterSpacing: -1,
    marginBottom: 6,
  },
  celebrationSubtitle: {
    fontSize: 15,
    fontFamily: 'SFProDisplayMedium',
    color: '#6B7280',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  star: {
    fontSize: 24,
  },

  // Progress Header
  progressHeader: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'SFProDisplayMedium',
    color: '#6B7280',
  },

  // Circular Progress Ring
  progressRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(90, 134, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#5A86FF',
    shadowColor: '#5A86FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  progressRingInner: {
    alignItems: 'center',
  },
  progressPercentageText: {
    fontSize: 22,
    fontFamily: 'SFProDisplayBold',
    color: '#5A86FF',
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  progressTotalText: {
    fontSize: 12,
    fontFamily: 'SFProDisplaySemibold',
    color: '#5A86FF',
    opacity: 0.7,
  },

  // Progress Bar
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(90, 134, 255, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5A86FF',
    borderRadius: 4,
  },

  // Questions List
  questionsList: {
    gap: 10,
  },
  reviewCardPressed: {
    opacity: 0.85,
  },

  // Answered Card (with gradient)
  reviewCardGradient: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(90, 134, 255, 0.25)',
    shadowColor: '#5A86FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },

  // Empty Card
  reviewCardEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(209, 213, 219, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  // Status Badges (absolute positioned)
  statusBadgeAnswered: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  statusBadgeUnanswered: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },

  // Card Content
  cardContent: {
    gap: 12,
  },

  // Question Row
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  // Question Number Badges - Answered
  questionNumberBadgeAnswered: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5A86FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  questionNumberTextAnswered: {
    fontSize: 12,
    fontFamily: 'SFProDisplayBold',
    color: '#5A86FF',
  },

  // Question Number Badges - Empty
  questionNumberBadgeEmpty: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionNumberTextEmpty: {
    fontSize: 12,
    fontFamily: 'SFProDisplayBold',
    color: '#9CA3AF',
  },

  // Question Text - Answered
  questionTextAnswered: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'SFProDisplaySemibold',
    color: '#1F2937',
    lineHeight: 21,
    paddingRight: 24, // Space for status badge
  },

  // Question Text - Empty
  questionTextEmpty: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'SFProDisplayMedium',
    color: '#6B7280',
    lineHeight: 21,
    paddingRight: 24, // Space for status badge
  },

  // Answer Pill - Answered
  answerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  answerPillText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'SFProDisplaySemibold',
    color: '#5A86FF',
  },

  // Empty State Pill
  emptyStatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 13,
    fontFamily: 'SFProDisplayMedium',
    color: '#9CA3AF',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'transparent',
    gap: 12,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  warningText: {
    fontSize: 13,
    fontFamily: 'SFProDisplayMedium',
    color: '#D97706',
    flex: 1,
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
  },
});
