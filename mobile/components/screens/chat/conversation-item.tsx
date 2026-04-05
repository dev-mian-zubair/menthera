import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Avatar } from '@/components/ui';
import { Conversation } from '@/lib/types';
import { useAgentsState } from '@/providers/AgentsProvider';
import { Colors, ComponentTokens } from '@/constants/Theme';
import { ROUTES } from '@/lib/routes';

export interface ConversationItemProps {
  conversation: Conversation;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation }) => {
  const { agents } = useAgentsState();
  const agent = agents.find(a => a.id === conversation.agentId);

  if (!agent) return null;

  const formatTime = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isYesterday) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <TouchableOpacity
      className="py-md border-b border-light-border"
      onPress={() => router.push(ROUTES.TABS.CHAT)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="relative mr-md">
          <Avatar
            src={{ uri: agent.avatar }}
            size="sm"
            fallback={agent.name.charAt(0)}
          />
        </View>

        {/* Conversation info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center">
              <Text className="text-base font-semibold text-light-text">
                {agent.name}
              </Text>
            </View>
            <Text className="text-xs text-light-text-secondary">
              {formatTime(conversation.lastMessageTime)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text
              className="text-sm text-light-text-secondary flex-1 mr-2"
              numberOfLines={1}
            >
              {conversation.lastMessage}
            </Text>

            {conversation.unreadCount > 0 && (
              <View
                className="rounded-full min-w-5 h-5 items-center justify-center px-1"
                style={{ backgroundColor: Colors.brand.purple }}
              >
                <Text className="text-xs text-white font-medium">
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export { ConversationItem };