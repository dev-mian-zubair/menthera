import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { QuestQuestion as QuestionType } from '@/lib/api';
import { ConfettiParticle } from './ConfettiParticle';
import { TimeTheme } from '@/lib/utils/time-theme';

interface QuestQuestionProps {
  question: QuestionType;
  currentValue?: number;
  onAnswer: (value: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showNavigation?: boolean;
  isLastQuestion?: boolean;
  disabled?: boolean;
  theme?: TimeTheme;
}

const LIKERT_SCALE = [
  { value: 1, label: 'Strongly Disagree', group: 'disagree' },
  { value: 2, label: 'Disagree', group: 'disagree' },
  { value: 3, label: 'Somewhat Disagree', group: 'disagree' },
  { value: 4, label: 'Neutral', group: 'neutral' },
  { value: 5, label: 'Somewhat Agree', group: 'agree' },
  { value: 6, label: 'Agree', group: 'agree' },
  { value: 7, label: 'Strongly Agree', group: 'agree' },
];

export const QuestQuestion: React.FC<QuestQuestionProps> = ({
  question,
  currentValue,
  onAnswer,
  onNext,
  onPrevious,
  showNavigation = true,
  isLastQuestion = false,
  disabled = false,
  theme,
}) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(currentValue ?? null);
  const [showConfetti, setShowConfetti] = useState(false);
  const isNavigating = useRef(false);

  // Single content-level animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isNavigating.current = false;
    setSelectedValue(currentValue ?? null);

    // Animate content in
    fadeAnim.setValue(0);
    slideAnim.setValue(20);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [question.questionId]);

  const handleSelect = (value: number) => {
    if (disabled || isNavigating.current) return;

    isNavigating.current = true;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setSelectedValue(value);
    onAnswer(value);

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1000);

    if (onNext) {
      // Let user see selection, then transition out
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 180,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -15,
            duration: 180,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => {
          onNext();
        });
      }, 400);
    } else {
      isNavigating.current = false;
    }
  };

  const renderOption = (option: typeof LIKERT_SCALE[0]) => {
    const isSelected = selectedValue === option.value;

    return (
      <Pressable
        key={option.value}
        onPress={() => handleSelect(option.value)}
        disabled={disabled || isNavigating.current}
        style={({ pressed }) => [
          styles.optionButton,
          pressed && !disabled && styles.optionPressed,
        ]}
      >
        {isSelected ? (
          <LinearGradient
            colors={theme?.quest.optionSelectedGradient || ['#5A86FF', '#7B9DFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.optionGradient,
              theme && {
                borderColor: theme.quest.optionSelectedBorder,
                shadowColor: theme.quest.optionSelectedBorder,
              },
            ]}
          >
            <Text style={[styles.optionLabel, styles.optionLabelSelected]}>
              {option.label}
            </Text>
            <View style={[styles.selectionIndicator, theme && { backgroundColor: theme.quest.optionCheckBackground }]}>
              <Ionicons name="checkmark" size={16} color={theme?.quest.optionCheckIcon || '#5A86FF'} />
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.optionCard, theme && { backgroundColor: theme.quest.optionCardBackground, borderColor: theme.quest.optionCardBorder }]}>
            <Text style={[styles.optionLabel, theme && { color: theme.quest.text }]}>{option.label}</Text>
            <View style={[styles.selectionIndicatorUnselected, theme && { borderColor: theme.quest.optionUnselectedBorder }]} />
          </View>
        )}
      </Pressable>
    );
  };

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

      {/* Confetti Effect */}
      <ConfettiParticle active={showConfetti} intensity="subtle" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Question Card */}
          <View style={[styles.questionCard, theme && { backgroundColor: theme.quest.cardBackground, borderColor: theme.quest.cardBorder }]}>
            <Text style={[styles.questionText, theme && { color: theme.quest.text }]}>{question.text}</Text>
          </View>

          {/* Emoji Scale */}
          <View style={styles.emojiScale}>
            <View style={styles.emojiItem}>
              <Text style={styles.emoji}>😞</Text>
              <Text style={[styles.emojiLabel, theme && { color: theme.quest.textMuted }]}>Disagree</Text>
            </View>
            <View style={styles.emojiItem}>
              <Text style={styles.emoji}>😐</Text>
              <Text style={[styles.emojiLabel, theme && { color: theme.quest.textMuted }]}>Neutral</Text>
            </View>
            <View style={styles.emojiItem}>
              <Text style={styles.emoji}>😄</Text>
              <Text style={[styles.emojiLabel, theme && { color: theme.quest.textMuted }]}>Agree</Text>
            </View>
          </View>

          {/* Likert Scale Options */}
          <View style={styles.optionsContainer}>
            {LIKERT_SCALE.map(renderOption)}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  questionText: {
    fontSize: 18,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  emojiScale: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  emojiItem: {
    alignItems: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 24,
  },
  emojiLabel: {
    fontSize: 10,
    fontFamily: 'SFProDisplayMedium',
    color: '#9CA3AF',
    letterSpacing: -0.1,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 2.5,
    borderColor: '#5A86FF',
    borderRadius: 16,
    shadowColor: '#5A86FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  optionCard: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'SFProDisplaySemibold',
    color: '#1F2937',
    letterSpacing: -0.3,
  },
  optionLabelSelected: {
    color: '#FFFFFF',
  },
  selectionIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicatorUnselected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
});
