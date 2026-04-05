/**
 * RecentActivitySection
 * Displays "Continue Your Conversation" card for recent agent interactions
 */

import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEngagement } from '@/providers/EngagementProvider';
import { useAgentsState } from '@/providers';
import { Avatar } from '@/components/common/Avatar';
import { ROUTES } from '@/lib/routes';
import { tokens } from '@/lib/styles/core/tokens';

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    marginBottom: 16,
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  } as ViewStyle,

  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0EAFF',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  headerTitle: {
    fontSize: 15,
    fontFamily: 'SFProDisplaySemibold',
    color: '#374151',
    letterSpacing: -0.2,
  } as TextStyle,

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#5A86FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  } as ViewStyle,

  avatarContainer: {
    position: 'relative',
  } as ViewStyle,

  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  } as ViewStyle,

  content: {
    flex: 1,
  } as ViewStyle,

  agentName: {
    fontSize: 16,
    fontFamily: 'SFProDisplaySemibold',
    color: '#111827',
    marginBottom: 2,
  } as TextStyle,

  timestamp: {
    fontSize: 13,
    fontFamily: 'SFProDisplayRegular',
    color: '#9CA3AF',
  } as TextStyle,

  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Streak badge styles
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    marginBottom: 12,
    alignSelf: 'flex-start',
  } as ViewStyle,

  streakText: {
    fontSize: 13,
    fontFamily: 'SFProDisplaySemibold',
    color: '#D97706',
  } as TextStyle,

  // Empty state
  emptyContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  } as ViewStyle,

  emptyText: {
    fontSize: 14,
    fontFamily: 'SFProDisplayRegular',
    color: '#9CA3AF',
    textAlign: 'center',
  } as TextStyle,
};

// ============================================
// HELPERS
// ============================================

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

// ============================================
// COMPONENT
// ============================================

interface RecentActivitySectionProps {
  onContinue?: (agentId: string) => void;
}

export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({ onContinue }) => {
  const { recentActivity, streak, loading } = useEngagement();
  const { agents } = useAgentsState();

  // Don't show if loading or no recent activity
  if (loading && recentActivity.length === 0) {
    return null;
  }

  // Get most recent conversation
  const mostRecent = recentActivity[0];

  if (!mostRecent) {
    return null;
  }

  // Find agent details
  const agent = agents.find(a => a.id === mostRecent.agentId);
  const agentName = mostRecent.agentName || agent?.name || 'Coach';
  const agentAvatar = agent?.avatar;

  const handlePress = () => {
    if (onContinue) {
      onContinue(mostRecent.agentId);
    } else {
      router.push(ROUTES.CHAT_WITH_AGENT(mostRecent.agentId));
    }
  };

  return (
    <View style={styles.container}>
      {/* Streak Badge - Show if streak > 0 */}
      {streak && streak.current > 0 && (
        <View style={styles.streakBadge}>
          <Text style={{ fontSize: 14 }}>🔥</Text>
          <Text style={styles.streakText}>
            {streak.current} day streak!
          </Text>
        </View>
      )}

      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="chatbubble" size={12} color={tokens.colors.brand.serenityBlue} />
        </View>
        <Text style={styles.headerTitle}>Continue Your Conversation</Text>
      </View>

      {/* Recent Activity Card */}
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Agent Avatar */}
        <View style={styles.avatarContainer}>
          <Avatar avatar={agentAvatar || ''} size={48} />
          <View style={styles.onlineIndicator} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.agentName} numberOfLines={1}>
            {agentName}
          </Text>
          <Text style={styles.timestamp}>
            Last active: {formatRelativeTime(mostRecent.lastInteractionDate)}
          </Text>
        </View>

        {/* Arrow */}
        <View style={styles.arrow}>
          <Ionicons name="arrow-forward" size={16} color="#6B7280" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default RecentActivitySection;
