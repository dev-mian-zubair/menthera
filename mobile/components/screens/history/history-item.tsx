import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Avatar } from '@/components/ui';
import { HistoryItem as HistoryItemType } from '@/lib/types';
import { useAgentsState } from '@/providers/AgentsProvider';
import { Colors } from '@/constants/Theme';
import { ROUTES } from '@/lib/routes';

export interface HistoryItemProps {
  item: HistoryItemType;
  animate?: boolean;
  onPress?: () => void;
}

const formatCallDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const HistoryItem = ({ item, onPress }: HistoryItemProps) => {
  const { agents } = useAgentsState();

  const formatHistoryTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const agent = agents.find(a => a.id === item.agentId);
  if (!agent) {
    return null;
  }

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      if (item.type === 'chat') {
        router.push(ROUTES.TABS.CHAT);
      } else {
        router.push(ROUTES.AGENT(agent.id));
      }
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <View className="bg-light-primary border-b border-light-border">
        <View className="flex-row items-center py-3">
          {/* Agent Avatar with Activity Icon */}
          <View className="relative mr-3">
            <Avatar
              src={{ uri: agent.avatar }}
              size="default"
              fallback={agent.name.charAt(0)}
            />

            {/* Activity Type Badge */}
            <View className="absolute -bottom-1 -right-1 bg-light-primary rounded-full w-5 h-5 items-center justify-center border border-light-border">
              <Ionicons
                name={item.type === 'chat' ? 'chatbubble' : 'call'}
                size={10}
                color={item.type === 'chat' ? Colors.brand.purple : Colors.brand.green}
              />
            </View>
          </View>

          {/* Activity Content */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center">
                <Text className="text-base font-semibold text-light-text">
                  {String(agent.name)}
                </Text>
              </View>
              <Text className="text-xs text-light-text-secondary">
                {String(formatHistoryTime(item.timestamp))}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text
                  className="text-sm text-light-text-secondary"
                  numberOfLines={2}
                >
                  {String(item.preview || 'No preview available')}
                </Text>
              </View>

              {/* Call Duration Badge */}
              {item.type === 'call' && typeof item.duration === 'number' && item.duration > 0 && (
                <View className="bg-light-tertiary rounded-full px-2 py-1">
                  <Text className="text-xs text-light-text-secondary font-medium">
                    {String(formatCallDuration(item.duration))}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};