import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Agent } from '@/lib/types';
import { chatStyles } from '@/lib/styles/screens/tabs/chat.styles';
import { Avatar } from '@/components/common/Avatar';
import { TimeTheme } from '@/lib/utils/time-theme';
import { logger } from '@/lib/utils/logger';

interface AgentSelectionModalProps {
  isVisible: boolean;
  agents: Agent[];
  selectedAgent: Agent | null;
  onAgentSelect: (agent: Agent) => void;
  onClose: () => void;
  onUpgrade?: () => void;
  onRefresh?: () => Promise<void>;
  theme?: TimeTheme;
}

/**
 * Modal component for selecting/switching between agents in chat
 * Displays a list of available agents with their avatars, names, and specialties
 */
export const AgentSelectionModal = ({
  isVisible,
  agents,
  selectedAgent,
  onAgentSelect,
  onClose,
  onUpgrade,
  onRefresh,
  theme,
}: AgentSelectionModalProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAgentPress = (agent: Agent) => {
    // If agent is locked, show paywall
    if (agent.isLocked && onUpgrade) {
      onUpgrade();
      return;
    }

    // Otherwise select the agent
    onAgentSelect(agent);
  };

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    try {
      setIsRefreshing(true);
      await onRefresh();
    } catch (error) {
      logger.error('[AgentSelectionModal] Error refreshing agents:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={chatStyles.modal.overlay}>
        <TouchableOpacity
          style={chatStyles.modal.touchableOverlay}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
        style={[
          chatStyles.modal.content,
          {
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            backgroundColor: theme?.modal.background,
          }
        ]}
      >
        {/* Handle Bar */}
        <View style={[chatStyles.modal.handleBar, theme && { backgroundColor: theme.modal.handleBar }]} />

        {/* Header */}
        <View style={chatStyles.modal.header}>
          <View style={chatStyles.modal.headerTitleGroup}>
            <Text style={[chatStyles.modal.headerTitle, theme && { color: theme.modal.headerTitle }]}>
              Switch Coach
            </Text>
            <Text style={[chatStyles.modal.headerSubtitle, theme && { color: theme.modal.headerSubtitle }]}>
              Choose a coach to chat with
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Refresh Button */}
            {onRefresh && (
              <TouchableOpacity
                onPress={handleRefresh}
                style={[chatStyles.modal.closeButton, theme && { backgroundColor: theme.modal.closeButtonBackground }]}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={theme?.modal.checkboxSelected || '#5A86FF'} />
                ) : (
                  <Ionicons name="refresh" size={20} color={theme?.modal.closeButtonIcon || '#2C2C2C'} />
                )}
              </TouchableOpacity>
            )}

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={[chatStyles.modal.closeButton, theme && { backgroundColor: theme.modal.closeButtonBackground }]}
            >
              <Ionicons name="close" size={20} color={theme?.modal.closeButtonIcon || '#2C2C2C'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Agents List */}
        <ScrollView
          style={chatStyles.modal.agentsList}
          showsVerticalScrollIndicator={false}
        >
          {agents.map((agent, index) => (
            <TouchableOpacity
              key={agent.id}
              onPress={() => handleAgentPress(agent)}
              style={[
                chatStyles.modal.agentItem,
                theme && { backgroundColor: theme.modal.itemBackground },
                selectedAgent?.id === agent.id
                  ? [chatStyles.modal.agentItemSelected, theme && { borderColor: theme.modal.selectedBorder }]
                  : chatStyles.modal.agentItemDefault
              ]}
            >
              {/* Avatar */}
              <View style={chatStyles.modal.agentAvatar}>
                <Avatar
                  avatar={agent.avatar}
                  size={48}
                />
              </View>

              {/* Info */}
              <View style={chatStyles.modal.agentInfo}>
                <View style={chatStyles.modal.agentNameRow}>
                  <Text style={[chatStyles.modal.agentName, theme && { color: theme.modal.itemTitle }]}>
                    {agent.name}
                  </Text>
                  {agent.specialties && agent.specialties.length > 0 && (
                    <View style={[
                      chatStyles.modal.agentDomainBadge,
                      agent.colors && {
                        backgroundColor: `${agent.colors.light}40`,
                        borderColor: agent.colors.primary,
                      }
                    ]}>
                      <Text style={[
                        chatStyles.modal.agentDomainText,
                        agent.colors && { color: agent.colors.primary }
                      ]}>
                        {agent.specialties[0]}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[chatStyles.modal.agentDescription, theme && { color: theme.modal.itemDescription }]} numberOfLines={2}>
                  {agent.teaser || agent.description}
                </Text>
              </View>

              {/* Selection Indicator or Lock Icon */}
              {agent.isLocked ? (
                <View style={chatStyles.modal.selectionIndicator}>
                  <Ionicons name="lock-closed" size={18} color={theme?.modal.lockIconColor || '#6B7280'} />
                </View>
              ) : selectedAgent?.id === agent.id ? (
                <View style={[
                  chatStyles.modal.selectionIndicator,
                  chatStyles.modal.selectionIndicatorSelected,
                  theme && { backgroundColor: theme.modal.checkboxSelected, borderColor: theme.modal.selectedBorder }
                ]}>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                </View>
              ) : (
                <View style={[
                  chatStyles.modal.selectionIndicator,
                  chatStyles.modal.selectionIndicatorUnselected,
                  theme && { backgroundColor: theme.modal.checkboxUnselected, borderColor: theme.modal.checkboxUnselectedBorder }
                ]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      </View>
    </Modal>
  );
};
