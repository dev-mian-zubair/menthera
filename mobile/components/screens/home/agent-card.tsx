import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import { Agent } from '@/lib/types';
import { ROUTES } from '@/lib/routes';
import { agentCardStyles } from '@/lib/styles/components/agent-card.styles';
import { Avatar } from '@/components/common/Avatar';

export interface AgentCardProps {
  agent: Agent;
  onPress?: () => void;
  style?: any;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress || (() => router.push(ROUTES.AGENT(agent.id)))}
      activeOpacity={0.95}
      style={style}
    >
      <View style={agentCardStyles.default.container}>
        <View style={agentCardStyles.default.avatarContainer}>
          <Avatar
            avatar={agent.avatar}
            size={50}
          />
        </View>
        <View style={agentCardStyles.default.nameRow}>
          <Text style={agentCardStyles.default.name} numberOfLines={1}>
            {agent.name}
          </Text>
          {agent.specialties && agent.specialties.length > 0 && (
            <View style={[
              agentCardStyles.default.domainBadge,
              agent.colors && {
                backgroundColor: `${agent.colors.light}40`,
              }
            ]}>
              <Text style={[
                agentCardStyles.default.domainText,
                agent.colors && { color: agent.colors.primary }
              ]} numberOfLines={1}>
                {agent.specialties[0]}
              </Text>
            </View>
          )}
        </View>
        <Text style={agentCardStyles.default.description} numberOfLines={2}>
          {agent.teaser || agent.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export { AgentCard };
