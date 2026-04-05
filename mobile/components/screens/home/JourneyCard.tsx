/**
 * JourneyCard - Compact Progress Display
 *
 * A glassmorphic card showing user's wellness journey progress with:
 * - Horizontal stat row (streak, sessions, minutes, badges)
 * - Link to full achievements screen
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/common/GlassCard';
import { useEngagement } from '@/providers/EngagementProvider';
import { useUsage } from '@/providers/UsageProvider';
import { TimeTheme } from '@/lib/utils/time-theme';

interface JourneyCardProps {
  theme: TimeTheme;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({ theme }) => {
  const { streak, totalUnlocked } = useEngagement();
  const { usage } = useUsage();

  const totalSessions = (usage?.messages.used || 0) + (usage?.minutes.used || 0);
  const totalMinutes = usage?.minutes.used || 0;
  const currentStreak = streak?.current || 0;

  const handleViewAchievements = () => {
    router.push('/achievements');
  };

  // Don't show if no streak and no activity
  if (currentStreak === 0 && totalSessions === 0) {
    return null;
  }

  return (
    <GlassCard
      backgroundColor="transparent"
      borderColor={theme.glass.cardBorder}
      borderRadius={20}
      padding={16}
      style={styles.card}
      showShadow={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textColor }]}>
          Your Journey
        </Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={handleViewAchievements}
        >
          <Text style={[styles.viewAllText, { color: theme.sectionLinkColor }]}>
            View All
          </Text>
          <Ionicons name="chevron-forward" size={12} color={theme.sectionLinkColor} />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {/* Streak */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: '#F97316' + '20' }]}>
            <Text style={{ fontSize: 11 }}>🔥</Text>
          </View>
          <View>
            <Text style={[styles.statValue, { color: theme.textColor }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtitleColor }]}>
              Days
            </Text>
          </View>
        </View>

        {/* Sessions */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: theme.sectionLinkColor + '15' }]}>
            <Ionicons name="chatbubbles" size={12} color={theme.sectionLinkColor} />
          </View>
          <View>
            <Text style={[styles.statValue, { color: theme.textColor }]}>
              {usage?.messages.used || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtitleColor }]}>
              Sessions
            </Text>
          </View>
        </View>

        {/* Minutes */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: '#6ED7C4' + '20' }]}>
            <Ionicons name="time" size={12} color="#6ED7C4" />
          </View>
          <View>
            <Text style={[styles.statValue, { color: theme.textColor }]}>
              {Math.round(totalMinutes)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtitleColor }]}>
              Minutes
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: '#FFD166' + '20' }]}>
            <Text style={{ fontSize: 11 }}>🏆</Text>
          </View>
          <View>
            <Text style={[styles.statValue, { color: theme.textColor }]}>
              {totalUnlocked || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtitleColor }]}>
              Badges
            </Text>
          </View>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'SFProDisplaySemibold',
    letterSpacing: -0.3,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'SFProDisplayMedium',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'SFProDisplayBold',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'SFProDisplayRegular',
    marginTop: -1,
  },
});

export default JourneyCard;
