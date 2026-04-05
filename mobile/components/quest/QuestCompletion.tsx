import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/lib/styles/core/tokens';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/Theme';
import { ConfettiParticle } from './ConfettiParticle';
import { TimeTheme } from '@/lib/utils/time-theme';

interface QuestCompletionProps {
  onContinueToChat: () => void;
  isLoading?: boolean;
  theme?: TimeTheme;
}

export const QuestCompletion: React.FC<QuestCompletionProps> = ({
  onContinueToChat,
  isLoading = false,
  theme,
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Success haptic
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptics not available
    }

    // Checkmark bounce animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Animated loading dots
    const animateDot = (dotAnim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dotOpacity1, 0);
    animateDot(dotOpacity2, 200);
    animateDot(dotOpacity3, 400);
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
      <View style={[styles.floatingCircle3, theme && { backgroundColor: theme.quest.floatingCircle3 }]} />

      {/* Confetti Effect */}
      <ConfettiParticle active={true} intensity="medium" />

      <View style={styles.content}>
        {/* Animated Checkmark */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={theme?.quest.completionIconGradient || ['#6ED7C4', '#5AC4B3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconCircle, theme && { shadowColor: theme.quest.completionIconShadow }]}
          >
            <Ionicons name="checkmark-circle" size={64} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.textContent, { opacity: fadeAnim }]}>
          {/* Title */}
          <Text style={[styles.title, theme && { color: theme.quest.text }]}>Quest Complete! 🎉</Text>

          {/* Description */}
          <Text style={[styles.description, theme && { color: theme.quest.textSecondary }]}>
            Amazing work! Your responses are unlocking personalized insights.
          </Text>

          {/* Report Status Card */}
          <View style={[styles.reportCard, theme && { backgroundColor: theme.quest.reportCardBackground, borderColor: theme.quest.reportCardBorder }]}>
            <View style={styles.reportHeader}>
              <Ionicons name="flash" size={20} color={theme?.quest.loadingDotColor || tokens.colors.brand.goldenGlow} />
              <Text style={[styles.reportTitle, theme && { color: theme.quest.text }]}>Generating Your Report</Text>
            </View>
            <Text style={[styles.reportSubtitle, theme && { color: theme.quest.textSecondary }]}>Your insights are being prepared</Text>

            {/* Animated Loading Dots */}
            <View style={styles.dotsContainer}>
              <Animated.View style={[styles.dot, { opacity: dotOpacity1 }, theme && { backgroundColor: theme.quest.loadingDotColor }]} />
              <Animated.View style={[styles.dot, { opacity: dotOpacity2 }, theme && { backgroundColor: theme.quest.loadingDotColor }]} />
              <Animated.View style={[styles.dot, { opacity: dotOpacity3 }, theme && { backgroundColor: theme.quest.loadingDotColor }]} />
            </View>
          </View>

          {/* Continue Button */}
          <Button
            variant="primary"
            size="lg"
            onPress={onContinueToChat}
            loading={isLoading}
            disabled={isLoading}
            fullWidth
            backgroundColor={theme?.quest.primaryButtonBackground}
            textColor={theme?.quest.primaryButtonText}
          >
            Meet Your Coach!
          </Button>

          {/* Info Text */}
          <Text style={[styles.infoText, theme && { color: theme.quest.textMuted }]}>
            Your personalized insights are waiting
          </Text>
        </Animated.View>
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
  floatingCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 193, 7, 0.06)',
    top: '30%',
    left: -40,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // Icon Container
  iconContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6ED7C4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  // Text Content
  textContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
    letterSpacing: -1,
  },
  description: {
    fontSize: 16,
    fontFamily: 'SFProDisplayRegular',
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Rewards Card (Optional)
  rewardsCard: {
    marginBottom: tokens.spacing.lg,
    borderRadius: 28,
    overflow: 'hidden',
    width: '100%',
  },
  rewardsGradient: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 32,
    marginBottom: tokens.spacing.xs,
  },
  rewardText: {
    fontSize: 13,
    fontFamily: 'SFProDisplaySemibold',
    color: '#6B46C1',
  },

  // Report Status Card
  reportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: 24,
    marginBottom: tokens.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    width: '100%',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: 'SFProDisplaySemibold',
    color: '#1F2937',
    marginLeft: tokens.spacing.xs,
  },
  reportSubtitle: {
    fontSize: 14,
    fontFamily: 'SFProDisplayRegular',
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },

  // Loading Dots
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.brand.serenityBlue,
  },

  // Info Text
  infoText: {
    fontSize: 13,
    fontFamily: 'SFProDisplayRegular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: tokens.spacing.md,
  },
});
