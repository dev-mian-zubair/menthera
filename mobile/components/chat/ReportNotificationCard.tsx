import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { reportCardStyles } from '@/lib/styles/components/report-card.styles';
import { useAgentsActions } from '@/providers';
import { Button } from '@/components/ui/button';
import { getTimeTheme } from '@/lib/utils/time-theme';

interface ReportNotificationCardProps {
  agentId: string;
  sessionId: string;
  title: string;
  shortDescription: string;
  icon?: string;

  // Optional: for chat context
  messageId?: string;
  timestamp?: string;
  questId?: string;

  // Optional: for agent details context
  completedAt?: string;

  // Optional: custom behavior
  onPress?: () => void;
  buttonText?: string;
  showTimestamp?: boolean; // Default true for chat, false for agent details
  noPadding?: boolean; // Default false (has padding for chat), true for agent details
}

/**
 * Report Notification Card
 * Reusable component for displaying report cards in chat and agent details
 *
 * Usage in Chat:
 * <ReportNotificationCard
 *   agentId={agentId}
 *   sessionId={sessionId}
 *   title={title}
 *   shortDescription={description}
 *   timestamp={timestamp}
 *   showTimestamp={true}
 * />
 *
 * Usage in Agent Details:
 * <ReportNotificationCard
 *   agentId={agentId}
 *   sessionId={sessionId}
 *   title={title}
 *   shortDescription={description}
 *   completedAt={completedAt}
 *   showTimestamp={false}
 *   noPadding={true}
 *   onPress={() => navigate to details}
 * />
 */
export const ReportNotificationCard: React.FC<ReportNotificationCardProps> = ({
  agentId,
  sessionId,
  title,
  shortDescription,
  icon = '❤️',
  messageId,
  timestamp,
  completedAt,
  onPress,
  buttonText = 'View Report',
  showTimestamp = true,
  noPadding = false,
}) => {
  const { getAgentById } = useAgentsActions();
  const agent = getAgentById(agentId);
  const theme = useMemo(() => getTimeTheme(), []);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default navigation to quest report screen
      router.push({
        pathname: '/quest-report/[agentId]',
        params: { agentId },
      });
    }
  };

  // Format relative time for completedAt
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <View style={[reportCardStyles.outerContainer, noPadding && { paddingHorizontal: 0 }]}>
      <View style={[
        reportCardStyles.container,
        {
          backgroundColor: theme.reportCard.background,
          shadowColor: theme.reportCard.shadowColor,
        }
      ]}>
        {/* Content wrapper */}
        <View style={reportCardStyles.contentWrapper}>
          {/* Icon and Title */}
          <View style={reportCardStyles.header}>
            <View style={reportCardStyles.iconContainer}>
              <Text style={reportCardStyles.icon}>{icon}</Text>
            </View>
            <View style={reportCardStyles.headerText}>
              <Text style={[reportCardStyles.title, { color: theme.reportCard.title }]}>{title}</Text>
              <Text style={[reportCardStyles.description, { color: theme.reportCard.description }]}>{shortDescription}</Text>
            </View>
          </View>

          {/* View Report Button */}
          <Button
            variant="primary"
            size="lg"
            onPress={handlePress}
            backgroundColor={agent?.colors?.primary || theme.quickAction.primaryBackground}
            fullWidth
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16, fontFamily: 'SFProDisplaySemibold', color: '#FFFFFF' }}>
                {buttonText}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          </Button>

          {/* Timestamp or Relative Date */}
          {showTimestamp && (
            <Text style={[reportCardStyles.timestamp, { color: theme.reportCard.timestamp }]}>
              {timestamp
                ? new Date(timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : completedAt
                ? getRelativeTime(completedAt)
                : ''}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};
