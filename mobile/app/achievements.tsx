/**
 * Achievements Screen
 * Redesigned with gamification best practices
 * Inspired by Duolingo, Fitbit, and modern achievement UIs
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import BackSvg from '@/assets/svgs/back.svg';
import { useEngagement } from '@/providers/EngagementProvider';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { AchievementProgress, AchievementCategory } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 20px padding on each side (40px total) + 12px gap * 2 (24px total) = 64px
const CARD_WIDTH = (SCREEN_WIDTH - 64) / 3;

// ============================================
// STYLES
// ============================================

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  } as ViewStyle,

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  headerTitle: {
    fontSize: 18,
    fontFamily: 'SFProDisplaySemibold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Balance the back button
  } as TextStyle,

  scrollContent: {
    paddingBottom: 40,
  } as ViewStyle,

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  } as ViewStyle,

  progressRingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  } as ViewStyle,

  progressRingContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5A86FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  } as ViewStyle,

  levelNumber: {
    fontSize: 20,
    fontFamily: 'SFProDisplayBold',
    color: '#FFFFFF',
  } as TextStyle,

  levelLabel: {
    fontSize: 12,
    fontFamily: 'SFProDisplayMedium',
    color: '#6B7280',
  } as TextStyle,

  heroTitle: {
    fontSize: 24,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    marginBottom: 4,
  } as TextStyle,

  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'SFProDisplayRegular',
    color: '#6B7280',
  } as TextStyle,

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 20,
    paddingHorizontal: 20,
  } as ViewStyle,

  statItem: {
    alignItems: 'center',
  } as ViewStyle,

  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  } as ViewStyle,

  statValue: {
    fontSize: 20,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
  } as TextStyle,

  statLabel: {
    fontSize: 12,
    fontFamily: 'SFProDisplayMedium',
    color: '#9CA3AF',
    marginTop: 2,
  } as TextStyle,

  // Category Tabs
  categoryTabsContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  } as ViewStyle,

  categoryTabsScroll: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,

  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  } as ViewStyle,

  categoryTabActive: {
    backgroundColor: '#5A86FF',
    borderColor: '#5A86FF',
  } as ViewStyle,

  categoryTabText: {
    fontSize: 13,
    fontFamily: 'SFProDisplaySemibold',
    color: '#6B7280',
  } as TextStyle,

  categoryTabTextActive: {
    color: '#FFFFFF',
  } as TextStyle,

  categoryTabCount: {
    fontSize: 11,
    fontFamily: 'SFProDisplayMedium',
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  } as TextStyle,

  categoryTabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#FFFFFF',
  } as TextStyle,

  // Achievements Grid
  achievementsSection: {
    paddingHorizontal: 20,
  } as ViewStyle,

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  } as ViewStyle,

  sectionTitle: {
    fontSize: 16,
    fontFamily: 'SFProDisplaySemibold',
    color: '#1F2937',
  } as TextStyle,

  sectionCount: {
    fontSize: 13,
    fontFamily: 'SFProDisplayMedium',
    color: '#9CA3AF',
  } as TextStyle,

  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  } as ViewStyle,

  // Achievement Card
  achievementCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  } as ViewStyle,

  achievementCardUnlocked: {
    borderColor: '#5A86FF',
    borderWidth: 2,
  } as ViewStyle,

  achievementCardLocked: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  } as ViewStyle,

  achievementCardInProgress: {
    borderColor: '#FCD34D',
    borderWidth: 1.5,
  } as ViewStyle,

  achievementIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  } as ViewStyle,

  achievementIconContainerUnlocked: {
    backgroundColor: '#EEF2FF',
  } as ViewStyle,

  achievementIconContainerLocked: {
    backgroundColor: '#F3F4F6',
  } as ViewStyle,

  achievementIconContainerInProgress: {
    backgroundColor: '#FEF9C3',
  } as ViewStyle,

  achievementIcon: {
    fontSize: 28,
  } as TextStyle,

  achievementIconLocked: {
    opacity: 0.4,
  } as TextStyle,

  achievementTitle: {
    fontSize: 11,
    fontFamily: 'SFProDisplaySemibold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 14,
  } as TextStyle,

  achievementTitleLocked: {
    color: '#9CA3AF',
  } as TextStyle,

  achievementStatus: {
    fontSize: 10,
    fontFamily: 'SFProDisplayMedium',
    textAlign: 'center',
  } as TextStyle,

  progressBarContainer: {
    width: '100%',
    marginTop: 6,
  } as ViewStyle,

  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  } as ViewStyle,

  progressFill: {
    height: '100%',
    backgroundColor: '#FCD34D',
    borderRadius: 2,
  } as ViewStyle,

  unlockedCheckmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  } as ViewStyle,

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
  } as ViewStyle,

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  } as ViewStyle,

  emptyTitle: {
    fontSize: 16,
    fontFamily: 'SFProDisplaySemibold',
    color: '#374151',
    marginBottom: 8,
  } as TextStyle,

  emptyText: {
    fontSize: 14,
    fontFamily: 'SFProDisplayRegular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  } as ViewStyle,
};

// ============================================
// HELPERS
// ============================================

type CategoryInfo = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  label: string;
};

const CATEGORIES: Record<AchievementCategory | 'all', CategoryInfo> = {
  all: { icon: 'grid', color: '#5A86FF', bgColor: '#EEF2FF', label: 'All' },
  messaging: { icon: 'chatbubble', color: '#5A86FF', bgColor: '#EEF2FF', label: 'Chat' },
  calls: { icon: 'call', color: '#10B981', bgColor: '#D1FAE5', label: 'Calls' },
  streaks: { icon: 'flame', color: '#F59E0B', bgColor: '#FEF3C7', label: 'Streaks' },
  quests: { icon: 'compass', color: '#8B5CF6', bgColor: '#EDE9FE', label: 'Quests' },
  engagement: { icon: 'heart', color: '#EC4899', bgColor: '#FCE7F3', label: 'Activity' },
};

const getUserLevel = (totalUnlocked: number): { level: number; title: string } => {
  if (totalUnlocked >= 20) return { level: 5, title: 'Master' };
  if (totalUnlocked >= 15) return { level: 4, title: 'Expert' };
  if (totalUnlocked >= 10) return { level: 3, title: 'Advanced' };
  if (totalUnlocked >= 5) return { level: 2, title: 'Learner' };
  return { level: 1, title: 'Beginner' };
};

// ============================================
// COMPONENTS
// ============================================

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  theme: ReturnType<typeof getTimeTheme>;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ progress, size, strokeWidth, theme }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={theme.achievements.levelBadgeBackground} />
          <Stop offset="100%" stopColor={theme.isNightMode ? '#818CF8' : '#8B5CF6'} />
        </LinearGradient>
      </Defs>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={theme.achievements.progressRingBackground}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#progressGradient)"
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

interface AchievementCardProps {
  achievement: AchievementProgress;
  theme: ReturnType<typeof getTimeTheme>;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, theme }) => {
  const isUnlocked = achievement.isUnlocked;
  const isLocked = !isUnlocked && achievement.progress === 0;
  const isInProgress = !isUnlocked && achievement.progress > 0;

  const getCardBorderColor = () => {
    if (isUnlocked) return theme.achievements.levelBadgeBackground;
    if (isInProgress) return '#FCD34D';
    return theme.achievements.cardBorder;
  };

  const getIconContainerBg = () => {
    if (isUnlocked) return theme.isNightMode ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF';
    if (isInProgress) return theme.isNightMode ? 'rgba(252, 211, 77, 0.2)' : '#FEF9C3';
    return theme.isNightMode ? 'rgba(100, 116, 139, 0.2)' : '#F3F4F6';
  };

  return (
    <View style={[
      styles.achievementCard,
      {
        backgroundColor: theme.achievements.cardBackground,
        borderColor: getCardBorderColor(),
        borderWidth: isUnlocked ? 2 : isInProgress ? 1.5 : 1,
      }
    ]}>
      <View style={[styles.achievementIconContainer, { backgroundColor: getIconContainerBg() }]}>
        {isUnlocked && (
          <View style={styles.unlockedCheckmark}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
        <Text style={[styles.achievementIcon, isLocked && styles.achievementIconLocked]}>
          {isLocked ? '🔒' : achievement.icon}
        </Text>
      </View>

      <Text
        style={[
          styles.achievementTitle,
          { color: isLocked ? theme.achievements.cardTitleLocked : theme.achievements.cardTitle }
        ]}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>

      {isUnlocked && (
        <Text style={[styles.achievementStatus, { color: '#10B981' }]}>
          Unlocked
        </Text>
      )}

      {isInProgress && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.isNightMode ? 'rgba(100, 116, 139, 0.3)' : '#E5E7EB' }]}>
            <View style={[styles.progressFill, { width: `${achievement.progress}%` }]} />
          </View>
          <Text style={[styles.achievementStatus, { color: '#F59E0B', marginTop: 4 }]}>
            {achievement.progress}%
          </Text>
        </View>
      )}

      {isLocked && (
        <Text style={[styles.achievementStatus, { color: theme.achievements.cardTitleLocked }]}>
          Locked
        </Text>
      )}
    </View>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useMemo(() => getTimeTheme(), []);

  const {
    achievements,
    totalUnlocked,
    totalAchievements,
    streak,
    achievementsLoading,
  } = useEngagement();

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  // Calculate stats
  const progressPercentage = totalAchievements > 0
    ? Math.round((totalUnlocked / totalAchievements) * 100)
    : 0;
  const userLevel = getUserLevel(totalUnlocked);

  // Filter achievements by category
  const filteredAchievements = React.useMemo(() => {
    if (selectedCategory === 'all') return achievements;
    return achievements.filter(a => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  // Count achievements per category
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, { total: number; unlocked: number }> = {
      all: { total: achievements.length, unlocked: achievements.filter(a => a.isUnlocked).length },
    };

    Object.keys(CATEGORIES).forEach(cat => {
      if (cat !== 'all') {
        const catAchievements = achievements.filter(a => a.category === cat);
        counts[cat] = {
          total: catAchievements.length,
          unlocked: catAchievements.filter(a => a.isUnlocked).length,
        };
      }
    });

    return counts;
  }, [achievements]);

  // Sort: unlocked first, then in-progress, then locked
  const sortedAchievements = React.useMemo(() => {
    return [...filteredAchievements].sort((a, b) => {
      if (a.isUnlocked && !b.isUnlocked) return -1;
      if (!a.isUnlocked && b.isUnlocked) return 1;
      if (a.progress > 0 && b.progress === 0) return -1;
      if (a.progress === 0 && b.progress > 0) return 1;
      return b.progress - a.progress;
    });
  }, [filteredAchievements]);

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.achievements.background }]}>
      <StatusBar
        barStyle={theme.isNightMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.achievements.background}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <BackSvg width={24} height={24} color={theme.achievements.backIcon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.achievements.headerTitle }]}>
          Achievements
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.progressRingContainer}>
            <ProgressRing
              progress={progressPercentage}
              size={140}
              strokeWidth={12}
              theme={theme}
            />
            <View style={styles.progressRingContent}>
              <View style={[styles.levelBadge, { backgroundColor: theme.achievements.levelBadgeBackground }]}>
                <Text style={[styles.levelNumber, { color: theme.achievements.levelBadgeText }]}>
                  {userLevel.level}
                </Text>
              </View>
              <Text style={[styles.levelLabel, { color: theme.achievements.levelLabel }]}>
                {userLevel.title}
              </Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: theme.achievements.heroTitle }]}>
            {totalUnlocked} of {totalAchievements}
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.achievements.heroSubtitle }]}>
            achievements unlocked
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.isNightMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              </View>
              <Text style={[styles.statValue, { color: theme.achievements.statValue }]}>{totalUnlocked}</Text>
              <Text style={[styles.statLabel, { color: theme.achievements.statLabel }]}>Unlocked</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.isNightMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' }]}>
                <Ionicons name="flame" size={22} color="#F59E0B" />
              </View>
              <Text style={[styles.statValue, { color: theme.achievements.statValue }]}>{streak?.current || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.achievements.statLabel }]}>Day Streak</Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.isNightMode ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE' }]}>
                <Ionicons name="star" size={22} color="#8B5CF6" />
              </View>
              <Text style={[styles.statValue, { color: theme.achievements.statValue }]}>{progressPercentage}%</Text>
              <Text style={[styles.statLabel, { color: theme.achievements.statLabel }]}>Complete</Text>
            </View>
          </View>
        </View>

          {/* Category Tabs */}
          <View style={styles.categoryTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabsScroll}
            >
              {Object.entries(CATEGORIES).map(([key, info]) => {
                const isActive = selectedCategory === key;
                const count = categoryCounts[key];

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryTab,
                      {
                        backgroundColor: isActive ? theme.achievements.tabActiveBackground : theme.achievements.tabBackground,
                        borderColor: isActive ? theme.achievements.tabActiveBackground : theme.achievements.tabBorder,
                      }
                    ]}
                    onPress={() => setSelectedCategory(key as AchievementCategory | 'all')}
                  >
                    <Ionicons
                      name={info.icon}
                      size={16}
                      color={isActive ? theme.achievements.tabActiveText : info.color}
                    />
                    <Text style={[
                      styles.categoryTabText,
                      { color: isActive ? theme.achievements.tabActiveText : theme.achievements.tabText }
                    ]}>
                      {info.label}
                    </Text>
                    {count && count.total > 0 && (
                      <Text style={[
                        styles.categoryTabCount,
                        {
                          backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : theme.achievements.tabBackground,
                          color: isActive ? theme.achievements.tabActiveText : theme.achievements.tabText,
                        }
                      ]}>
                        {count.unlocked}/{count.total}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Achievements Grid */}
          <View style={styles.achievementsSection}>
            {achievementsLoading && achievements.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.achievements.levelBadgeBackground} />
              </View>
            ) : sortedAchievements.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.achievements.cardBackground }]}>
                  <Ionicons name="trophy-outline" size={36} color={theme.achievements.statLabel} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.achievements.heroTitle }]}>
                  No achievements yet
                </Text>
                <Text style={[styles.emptyText, { color: theme.achievements.heroSubtitle }]}>
                  Start chatting with your coaches{'\n'}to unlock achievements!
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.achievements.sectionTitle }]}>
                    {selectedCategory === 'all' ? 'All Achievements' : CATEGORIES[selectedCategory].label}
                  </Text>
                  <Text style={[styles.sectionCount, { color: theme.achievements.sectionCount }]}>
                    {categoryCounts[selectedCategory]?.unlocked || 0} / {categoryCounts[selectedCategory]?.total || 0}
                  </Text>
                </View>

                <View style={styles.achievementsGrid}>
                  {sortedAchievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} theme={theme} />
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
    </View>
  );
}
