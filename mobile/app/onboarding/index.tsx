import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Layout,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useOnboarding, OnboardingAnswers } from '@/hooks/useOnboarding';
import { useAgentsState, useAgentsActions } from '@/providers';
import { Avatar } from '@/components/common/Avatar';
import { AnimatedAnimalAvatar, hasAnimatedVersion } from '@/components/animations/AnimatedAnimalAvatar';
import { isSvgAvatar } from '@/lib/utils/avatar-utils';
import type { Agent } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { user } = useUser();
  const { isLoaded, isSubmitting, error, submitOnboarding } = useOnboarding();
  const { agents, isLoading: isLoadingAgents } = useAgentsState();
  const { fetchAgents } = useAgentsActions();
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedStep, setDisplayedStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const isAnimating = useRef(false);

  // Shared values for directional slide transition
  const translateX = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Directional slide transition: fade out old content, swap, fade in new
  useEffect(() => {
    if (currentStep === displayedStep || isAnimating.current) return;
    isAnimating.current = true;

    const isForward = currentStep > displayedStep;
    const exitDirection = isForward ? -SCREEN_WIDTH * 0.15 : SCREEN_WIDTH * 0.15;
    const enterFrom = isForward ? SCREEN_WIDTH * 0.15 : -SCREEN_WIDTH * 0.15;
    const targetStep = currentStep;

    // Phase 1: fade out current content
    translateX.value = withTiming(exitDirection, { duration: 500 });
    contentOpacity.value = withTiming(0, { duration: 500 });

    // Phase 2: after exit completes, swap content and fade in
    setTimeout(() => {
      setDisplayedStep(targetStep);
      translateX.value = enterFrom;
      requestAnimationFrame(() => {
        translateX.value = withTiming(0, { duration: 600 });
        contentOpacity.value = withTiming(1, { duration: 600 });
        setTimeout(() => { isAnimating.current = false; }, 650);
      });
    }, 530);
  }, [currentStep, displayedStep]);

  const contentAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: contentOpacity.value,
  }));

  // Language options with codes for backend
  const languageOptions = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'es', label: 'Spanish', native: 'Espanol' },
    { code: 'fr', label: 'French', native: 'Francais' },
    { code: 'de', label: 'German', native: 'Deutsch' },
    { code: 'pt', label: 'Portuguese', native: 'Portugues' },
  ];

  const questions = [
    {
      id: 'selectedAgentId',
      title: 'Who Gets\nYou Best?',
      subtitle: 'Pick your first coach—someone who truly understands you',
      type: 'agentSelection',
      gradient: ['#E9D5FF', '#DDD6FE'] as const,
    },
    {
      id: 'preferredLanguage',
      title: 'Choose Your\nLanguage',
      subtitle: 'Your coach will communicate with you in this language',
      type: 'languageSelection',
      gradient: ['#FDE68A', '#FEF3C7'] as const,
    },
    {
      id: 'age',
      title: "What's Your\nVibe?",
      subtitle: "Your stage of life shapes how we'll support you",
      type: 'options',
      options: ['18-24', '25-34', '35-44', '45-54', '55+'],
      gradient: ['#BFDBFE', '#DBEAFE'] as const,
    },
    {
      id: 'preferredCoachingStyle',
      title: 'How Do You\nLike Feedback?',
      subtitle: 'Pick the coaching style that motivates you most',
      type: 'options',
      options: ['Direct & Assertive', 'Supportive & Gentle', 'Balanced'],
      gradient: ['#A7F3D0', '#D1FAE5'] as const,
    },
  ];

  const currentQuestion = questions[displayedStep];

  const triggerHaptic = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available, silently ignore
    }
  };

  const handleOptionSelect = (option: string) => {
    triggerHaptic();
    setAnswers({ ...answers, [currentQuestion.id]: option });

    // Auto-advance to next step after selection
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }, 600);
  };

  const handleAgentSelect = (agentId: string) => {
    triggerHaptic();
    setAnswers({ ...answers, selectedAgentId: agentId });

    // Auto-advance to next step after selection
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }, 600);
  };

  const handleLanguageSelect = (languageCode: string) => {
    triggerHaptic();
    setAnswers({ ...answers, preferredLanguage: languageCode });

    // Auto-advance to next step after selection
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }, 600);
  };

  const canContinue = (): boolean => {
    const value = answers[currentQuestion.id];
    if (currentQuestion.type === 'agentSelection') {
      return !!answers.selectedAgentId;
    }
    if (currentQuestion.type === 'languageSelection') {
      return !!answers.preferredLanguage;
    }
    return !!value;
  };

  const handleNext = () => {
    triggerHaptic();
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    triggerHaptic();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Haptics not available, silently ignore
      }
      const success = await submitOnboarding(answers);

      if (success) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await user?.reload();
      } else {
        Alert.alert('Error', error || 'Failed to submit onboarding');
      }
    } catch (err) {
      logger.error('[Onboarding] Error:', err);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const isLastStep = currentStep === questions.length - 1;

  // Bounce animation for selection feedback
  const BounceablePill = ({ children, onPress, style, isSelected, index }: {
    children: React.ReactNode;
    onPress: () => void;
    style: any[];
    isSelected: boolean;
    index: number;
  }) => {
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
      scale.value = withSequence(
        withTiming(0.95, { duration: 80 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
      onPress();
    };

    return (
      <Animated.View style={animStyle}>
        <TouchableOpacity
          style={style}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Bounceable card for agent grid
  const BounceableCard = ({ children, onPress, style, index }: {
    children: React.ReactNode;
    onPress: () => void;
    style: any[];
    index: number;
  }) => {
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
      scale.value = withSequence(
        withTiming(0.95, { duration: 80 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
      onPress();
    };

    return (
      <Animated.View style={animStyle}>
        <TouchableOpacity
          style={style}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render agent cards in grid
  const renderAgentSelection = () => {
    if (isLoadingAgents) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      );
    }

    if (!agents || agents.length === 0) {
      return <Text style={styles.errorWhite}>No coaches available</Text>;
    }

    return (
      <ScrollView
        style={styles.agentScrollView}
        contentContainerStyle={styles.agentGrid}
        showsVerticalScrollIndicator={false}
      >
        {agents.map((agent, index) => {
          const isSelected = answers.selectedAgentId === agent.id;
          const useAnimated = isSvgAvatar(agent.avatar) && hasAnimatedVersion(agent.avatar);
          return (
            <BounceableCard
              key={agent.id}
              index={index}
              onPress={() => handleAgentSelect(agent.id)}
              style={[styles.agentGridCard, isSelected && styles.agentGridCardSelected]}
            >
              <View style={styles.agentAvatarContainer}>
                {useAnimated ? (
                  <AnimatedAnimalAvatar
                    avatar={agent.avatar}
                    size={64}
                    isActive={isSelected}
                    audioLevel={0}
                  />
                ) : (
                  <Avatar avatar={agent.avatar} size={64} />
                )}
                {isSelected && (
                  <View style={styles.selectedCheckmark}>
                    <Text style={styles.checkmarkIcon}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.agentGridName} numberOfLines={1}>
                {agent.name}
              </Text>
              {agent.specialties && agent.specialties[0] && (
                <Text style={styles.agentGridSpecialty} numberOfLines={1}>
                  {agent.specialties[0]}
                </Text>
              )}
            </BounceableCard>
          );
        })}
      </ScrollView>
    );
  };

  // Render language selection
  const renderLanguageSelection = () => {
    return (
      <View style={styles.optionsContainer}>
        {languageOptions.map((lang, index) => {
          const isSelected = answers.preferredLanguage === lang.code;
          return (
            <BounceablePill
              key={lang.code}
              index={index}
              isSelected={isSelected}
              onPress={() => handleLanguageSelect(lang.code)}
              style={[styles.optionPill, isSelected && styles.optionPillSelected]}
            >
              <Text style={[styles.optionPillText, isSelected && styles.optionPillTextSelected]}>
                {lang.label} ({lang.native})
              </Text>
            </BounceablePill>
          );
        })}
      </View>
    );
  };

  // Render option buttons
  const renderOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        {currentQuestion.options?.map((option, index) => {
          const isSelected = answers[currentQuestion.id] === option;
          return (
            <BounceablePill
              key={option}
              index={index}
              isSelected={isSelected}
              onPress={() => handleOptionSelect(option)}
              style={[styles.optionPill, isSelected && styles.optionPillSelected]}
            >
              <Text style={[styles.optionPillText, isSelected && styles.optionPillTextSelected]}>
                {option}
              </Text>
            </BounceablePill>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={currentQuestion.gradient}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Progress Dots */}
          <View style={styles.dotsContainer}>
            {questions.map((_, index) => (
              <Animated.View
                key={index}
                layout={Layout.duration(250)}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                  index < currentStep && styles.dotCompleted,
                ]}
              />
            ))}
          </View>

          {/* Main Content */}
          <Animated.View style={[styles.content, contentAnimStyle]}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{currentQuestion.title}</Text>
              <Text style={styles.subtitle}>{currentQuestion.subtitle}</Text>
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
              {currentQuestion.type === 'agentSelection'
                ? renderAgentSelection()
                : currentQuestion.type === 'languageSelection'
                ? renderLanguageSelection()
                : renderOptions()}
            </View>
          </Animated.View>

          {/* Bottom Navigation */}
          <View style={styles.bottomNav}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorWhite}>⚠️ {error}</Text>
              </View>
            )}

            {/* Only show buttons on last step or if user can go back */}
            {(isLastStep || currentStep > 0) && (
              <View style={styles.navButtons}>
                {currentStep > 0 && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.backButtonText}>←</Text>
                  </TouchableOpacity>
                )}

                {isLastStep && (
                  <TouchableOpacity
                    style={[
                      styles.nextButton,
                      !canContinue() && styles.nextButtonDisabled,
                      currentStep === 0 && styles.nextButtonFull,
                    ]}
                    onPress={handleSubmit}
                    disabled={!canContinue() || isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Text style={styles.nextButtonText}>Let's Go! →</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  dotActive: {
    width: 32,
    backgroundColor: '#000000',
  },
  dotCompleted: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'SFProDisplayRegular',
    color: '#6B7280',
    lineHeight: 26,
  },
  contentArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentScrollView: {
    flex: 1,
    marginBottom: 20,
  },
  agentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 40,
  },
  agentGridCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  agentGridCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    transform: [{ scale: 0.98 }],
  },
  agentAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  selectedCheckmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  checkmarkIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  agentGridName: {
    fontSize: 15,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  agentGridSpecialty: {
    fontSize: 11,
    fontFamily: 'SFProDisplayMedium',
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  optionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionPillSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  optionPillText: {
    fontSize: 18,
    fontFamily: 'SFProDisplaySemibold',
    color: '#1F2937',
    textAlign: 'center',
  },
  optionPillTextSelected: {
    color: '#FFFFFF',
  },
  bottomNav: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorWhite: {
    fontSize: 14,
    fontFamily: 'SFProDisplayMedium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  backButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#000000',
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 1,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  nextButtonText: {
    fontSize: 20,
    fontFamily: 'SFProDisplayBold',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
