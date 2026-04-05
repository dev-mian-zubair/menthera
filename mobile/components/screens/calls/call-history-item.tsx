import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CallHistory } from '@/lib/types';
import { Avatar } from '@/components/ui';
import { callHistoryItemStyles } from '@/lib/styles/components/call-history-item.styles';
import { useAgentsState } from '@/providers/AgentsProvider';
import { TimeTheme } from '@/lib/utils/time-theme';

export interface CallHistoryItemProps {
  call: CallHistory;
  onPress: () => void;
  theme?: TimeTheme;
}

const CallHistoryItem: React.FC<CallHistoryItemProps> = ({ call, onPress, theme }) => {
  const { agents } = useAgentsState();
  const agent = agents.find(a => a.id === call.agentId);
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getStatusText = () => {
    if (call.status === 'missed') {
      return 'Missed';
    }
    const duration = formatDuration(call.duration);
    return duration ? `${duration}` : 'Completed';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        callHistoryItemStyles.container,
        theme && {
          borderColor: theme.glass.cardBorder,
        }
      ]}
      activeOpacity={0.7}
    >
      {/* Agent Avatar */}
      <View style={callHistoryItemStyles.avatarContainer}>
        <Avatar
          src={{ uri: call.agentAvatar }}
          size="default"
          fallback={call.agentName.charAt(0)}
        />
      </View>

      {/* Call Info */}
      <View style={callHistoryItemStyles.info.container}>
        <View style={callHistoryItemStyles.info.nameRow}>
          <Text style={[
            callHistoryItemStyles.info.name,
            theme && { color: theme.textColor }
          ]}>
            {call.agentName}
          </Text>
          {call.status === 'missed' && (
            <View style={callHistoryItemStyles.info.missedBadge}>
              <Text style={callHistoryItemStyles.info.missedBadgeText}>
                Missed
              </Text>
            </View>
          )}
        </View>

        <View style={callHistoryItemStyles.info.statusRow}>
          <View style={[
            callHistoryItemStyles.info.statusDot,
            call.status === 'missed'
              ? callHistoryItemStyles.info.statusDotMissed
              : [
                  callHistoryItemStyles.info.statusDotCompleted,
                  agent?.colors && { backgroundColor: agent.colors.primary }
                ]
          ]} />
          <Text style={[
            callHistoryItemStyles.info.statusText,
            theme && { color: theme.subtitleColor }
          ]}>
            {getStatusText()}
          </Text>
          <Text style={[
            callHistoryItemStyles.info.separator,
            theme && { color: theme.subtitleColor }
          ]}>
            •
          </Text>
          <Text style={[
            callHistoryItemStyles.info.timestamp,
            theme && { color: theme.subtitleColor }
          ]}>
            {formatTime(call.timestamp)}
          </Text>
        </View>
      </View>

      {/* Call Type Icon */}
      <View style={callHistoryItemStyles.callIcon.container}>
        <Ionicons
          name="call"
          size={20}
          color={call.status === 'missed'
            ? '#FF6B6B'
            : (agent?.colors?.primary || theme?.calls.ctaButtonBackground || '#5A86FF')
          }
        />
      </View>
    </TouchableOpacity>
  );
};

export { CallHistoryItem };
