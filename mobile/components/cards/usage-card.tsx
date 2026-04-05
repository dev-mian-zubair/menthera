import React, { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { usageCardStyles } from '@/lib/styles/components/usage-card.styles';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { useUsage } from '@/providers/UsageProvider';
import { useEngagement } from '@/providers/EngagementProvider';
import { logger } from '@/lib/utils/logger';

export interface UsageCardProps {}

// Gradient progress ring component with glow effect
const GradientProgressRing: React.FC<{
  progress: number;
  size: number;
  strokeWidth: number;
}> = ({ progress, size, strokeWidth }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="achievementGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8B5CF6" />
          <Stop offset="50%" stopColor="#5A86FF" />
          <Stop offset="100%" stopColor="#06B6D4" />
        </LinearGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#F3F4F6"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#achievementGradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

// Creative gamification styles
const gamificationStyles = {
  // Streak Badge
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  } as ViewStyle,
  streakText: {
    fontSize: 13,
    fontFamily: 'SFProDisplayBold',
    color: '#B45309',
  } as TextStyle,
  streakNumber: {
    fontSize: 15,
    fontFamily: 'SFProDisplayBold',
    color: '#D97706',
  } as TextStyle,

  // Gamification Section Container
  gamificationSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  } as ViewStyle,

  // Achievement Card
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: '#EEF2FF',
  } as ViewStyle,

  achievementProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  achievementProgressInner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  achievementTrophy: {
    fontSize: 18,
  } as TextStyle,

  achievementContent: {
    flex: 1,
    gap: 2,
  } as ViewStyle,

  achievementLabel: {
    fontSize: 10,
    fontFamily: 'SFProDisplaySemibold',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  } as TextStyle,

  achievementTitle: {
    fontSize: 16,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
  } as TextStyle,

  achievementSubtitle: {
    fontSize: 12,
    fontFamily: 'SFProDisplayMedium',
    color: '#6B7280',
    marginTop: 2,
  } as TextStyle,

  // Mini badges row - Stacked overlap style
  miniBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  } as ViewStyle,

  miniBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginLeft: -8,
  } as ViewStyle,

  miniBadgeFirst: {
    marginLeft: 0,
  } as ViewStyle,

  miniBadgeText: {
    fontSize: 14,
  } as TextStyle,

  moreBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5A86FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  } as ViewStyle,

  moreBadgeText: {
    fontSize: 10,
    fontFamily: 'SFProDisplayBold',
    color: '#FFFFFF',
  } as TextStyle,

  // View button
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#5A86FF',
    borderRadius: 12,
  } as ViewStyle,

  viewAllText: {
    fontSize: 13,
    fontFamily: 'SFProDisplayBold',
    color: '#FFFFFF',
  } as TextStyle,

  // Next milestone card
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  } as ViewStyle,

  milestoneIconWrapper: {
    position: 'relative',
  } as ViewStyle,

  milestoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FCD34D',
  } as ViewStyle,

  milestoneIconText: {
    fontSize: 22,
  } as TextStyle,

  milestoneSparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 12,
  } as TextStyle,

  milestoneContent: {
    flex: 1,
  } as ViewStyle,

  milestoneLabel: {
    fontSize: 10,
    fontFamily: 'SFProDisplayBold',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  } as TextStyle,

  milestoneTitle: {
    fontSize: 14,
    fontFamily: 'SFProDisplaySemibold',
    color: '#78350F',
  } as TextStyle,

  milestoneProgressWrapper: {
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,

  milestoneProgressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FCD34D',
  } as ViewStyle,

  milestoneProgressValue: {
    fontSize: 12,
    fontFamily: 'SFProDisplayBold',
    color: '#B45309',
    textAlign: 'center',
  } as TextStyle,

  milestoneProgressLabel: {
    fontSize: 9,
    fontFamily: 'SFProDisplayMedium',
    color: '#92400E',
  } as TextStyle,
};

export const UsageCard: React.FC<UsageCardProps> = () => {
  const { usage, loading, error, refetch } = useUsage();
  const { streak, nextMilestone, totalUnlocked, totalAchievements, unlockedAchievements } = useEngagement();

  // Get time-aware theme
  const theme = useMemo(() => getTimeTheme(), []);

  // Get recent unlocked achievements for mini badge display
  const recentBadges = unlockedAchievements?.slice(0, 3) || [];
  const remainingBadges = Math.max(0, totalUnlocked - 3);

  // Calculate achievement progress percentage
  const achievementProgress = totalAchievements > 0
    ? Math.round((totalUnlocked / totalAchievements) * 100)
    : 0;

  useEffect(() => {
    logger.debug('[UsageCard] Mounted / State changed:', { loading, hasUsage: !!usage, error });
  }, [loading, usage, error]);

  // Format plan name
  const formatPlan = (plan: string | undefined) => {
    if (!plan || plan === 'inactive') return 'Inactive';
    if (plan === 'byok') return 'BYOK';
    return plan;
  };

  const handleAchievementsPress = () => {
    // Dismiss the profile modal first, then navigate to achievements
    // Without this, pushing a card screen from inside a fullScreenModal causes the UI to freeze
    router.back();
    setTimeout(() => {
      router.push('/achievements');
    }, 300);
  };

  return (
    <View style={[
      usageCardStyles.container,
      { backgroundColor: theme.usageCard.background }
    ]}>
      {/* Streak Badge - Show if streak > 0 */}
      {streak && streak.current > 0 && (
        <View style={[
          gamificationStyles.streakBadge,
          { backgroundColor: theme.usageCard.streakBackground }
        ]}>
          <Text style={{ fontSize: 16 }}>🔥</Text>
          <Text style={[gamificationStyles.streakNumber, { color: theme.usageCard.streakText }]}>
            {streak.current}
          </Text>
          <Text style={[gamificationStyles.streakText, { color: theme.usageCard.streakText }]}>
            Day Streak!
          </Text>
        </View>
      )}

      {/* Header with Plan Badge */}
      <View style={usageCardStyles.header}>
        <View style={usageCardStyles.headerLeft}>
          <Text style={[
            usageCardStyles.planBadge,
            {
              backgroundColor: theme.usageCard.planBadgeBackground,
              color: theme.usageCard.planBadgeText,
            }
          ]}>{formatPlan(usage?.plan)}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={theme.usageCard.iconColor} />
        ) : (
          <TouchableOpacity onPress={refetch}>
            <Ionicons name="refresh" size={18} color={error ? '#FF6B6B' : theme.usageCard.labelColor} />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={usageCardStyles.errorContainer}>
          <Text style={usageCardStyles.errorText}>Failed to load usage</Text>
        </View>
      ) : (
        <>
          {/* Usage: Always show unlimited for BYOK */}
          <View style={usageCardStyles.gaugesGrid}>
            <View style={usageCardStyles.gaugeItem}>
              <View style={usageCardStyles.statHeader}>
                <Ionicons name="time-outline" size={16} color={theme.usageCard.iconColor} />
                <Text style={[usageCardStyles.statLabel, { color: theme.usageCard.labelColor }]}>
                  Minutes
                </Text>
              </View>
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <Ionicons name="infinite-outline" size={36} color={theme.usageCard.iconColor} />
                <Text style={{ fontSize: 14, fontFamily: 'SFProDisplaySemibold', color: theme.usageCard.valueColor, marginTop: 4 }}>
                  Unlimited
                </Text>
              </View>
            </View>

            <View style={[usageCardStyles.divider, { backgroundColor: theme.usageCard.dividerColor }]} />

            <View style={usageCardStyles.gaugeItem}>
              <View style={usageCardStyles.statHeader}>
                <Ionicons name="chatbubble-outline" size={16} color={theme.usageCard.iconColor} />
                <Text style={[usageCardStyles.statLabel, { color: theme.usageCard.labelColor }]}>
                  Messages
                </Text>
              </View>
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <Ionicons name="infinite-outline" size={36} color={theme.usageCard.iconColor} />
                <Text style={{ fontSize: 14, fontFamily: 'SFProDisplaySemibold', color: theme.usageCard.valueColor, marginTop: 4 }}>
                  Unlimited
                </Text>
              </View>
            </View>
          </View>

          {/* Gamification Section */}
          <View style={[
            gamificationStyles.gamificationSection,
            { borderTopColor: theme.usageCard.dividerColor }
          ]}>
            {/* Achievement Progress Card */}
            <TouchableOpacity
              style={[
                gamificationStyles.achievementCard,
                {
                  backgroundColor: theme.usageCard.achievementCardBackground,
                  borderColor: theme.usageCard.achievementCardBorder,
                }
              ]}
              onPress={handleAchievementsPress}
              activeOpacity={0.8}
            >
              {/* Gradient Progress Ring */}
              <View style={gamificationStyles.achievementProgressContainer}>
                <GradientProgressRing
                  progress={achievementProgress}
                  size={56}
                  strokeWidth={5}
                />
                <View style={[
                  gamificationStyles.achievementProgressInner,
                  { backgroundColor: theme.usageCard.achievementCardBackground }
                ]}>
                  <Text style={gamificationStyles.achievementTrophy}>🏆</Text>
                </View>
              </View>

              {/* Content */}
              <View style={gamificationStyles.achievementContent}>
                <Text style={[
                  gamificationStyles.achievementLabel,
                  { color: theme.usageCard.iconColor }
                ]}>Achievements</Text>
                <Text style={[
                  gamificationStyles.achievementTitle,
                  { color: theme.usageCard.valueColor }
                ]}>
                  {totalUnlocked} of {totalAchievements}
                </Text>

                {/* Mini badges row - Stacked style */}
                {recentBadges.length > 0 ? (
                  <View style={gamificationStyles.miniBadgesRow}>
                    {recentBadges.map((badge, index) => (
                      <View
                        key={badge.id}
                        style={[
                          gamificationStyles.miniBadge,
                          index === 0 && gamificationStyles.miniBadgeFirst,
                          { zIndex: recentBadges.length - index },
                        ]}
                      >
                        <Text style={gamificationStyles.miniBadgeText}>{badge.icon}</Text>
                      </View>
                    ))}
                    {remainingBadges > 0 && (
                      <View style={[gamificationStyles.moreBadge, { zIndex: 0, backgroundColor: theme.usageCard.iconColor }]}>
                        <Text style={gamificationStyles.moreBadgeText}>+{remainingBadges}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={[
                    gamificationStyles.achievementSubtitle,
                    { color: theme.usageCard.labelColor }
                  ]}>
                    Start unlocking badges!
                  </Text>
                )}
              </View>

              {/* Arrow */}
              <Ionicons name="chevron-forward" size={20} color={theme.usageCard.labelColor} />
            </TouchableOpacity>

            {/* Next Milestone Card */}
            {nextMilestone && (
              <View style={[
                gamificationStyles.milestoneCard,
                {
                  backgroundColor: theme.usageCard.milestoneBackground,
                  borderColor: theme.usageCard.milestoneBorder,
                }
              ]}>
                <View style={gamificationStyles.milestoneIconWrapper}>
                  <View style={[
                    gamificationStyles.milestoneIcon,
                    {
                      backgroundColor: theme.usageCard.milestoneBackground,
                      borderColor: theme.usageCard.milestoneBorder,
                    }
                  ]}>
                    <Text style={gamificationStyles.milestoneIconText}>{nextMilestone.icon}</Text>
                  </View>
                  <Text style={gamificationStyles.milestoneSparkle}>✨</Text>
                </View>

                <View style={gamificationStyles.milestoneContent}>
                  <Text style={[
                    gamificationStyles.milestoneLabel,
                    { color: theme.usageCard.iconColor }
                  ]}>Next Milestone</Text>
                  <Text style={[
                    gamificationStyles.milestoneTitle,
                    { color: theme.usageCard.valueColor }
                  ]} numberOfLines={1}>
                    {nextMilestone.reward}
                  </Text>
                </View>

                <View style={gamificationStyles.milestoneProgressWrapper}>
                  <View style={[
                    gamificationStyles.milestoneProgressCircle,
                    {
                      backgroundColor: theme.usageCard.milestoneBackground,
                      borderColor: theme.usageCard.milestoneBorder,
                    }
                  ]}>
                    <Text style={[
                      gamificationStyles.milestoneProgressValue,
                      { color: theme.usageCard.iconColor }
                    ]}>
                      {nextMilestone.current}/{nextMilestone.target}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
};
