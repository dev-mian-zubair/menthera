import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CallHistory } from '@/lib/types';
import { Avatar } from '@/components/ui';
import { useAgentsState } from '@/providers/AgentsProvider';
import { useStartCall } from '@/hooks/useStartCall';
import { ROUTES } from '@/lib/routes';
import { callInfoSheetStyles } from '@/lib/styles/components/call-info-sheet.styles';
import ColorPalette from '@/constants/Colors';
import { TimeTheme } from '@/lib/utils/time-theme';
import { logger } from '@/lib/utils/logger';

export interface CallInfoSheetProps {
  isVisible: boolean;
  onClose: () => void;
  call: CallHistory | null;
  theme?: TimeTheme;
}

const CallInfoSheet: React.FC<CallInfoSheetProps> = ({ isVisible, onClose, call, theme }) => {
  const insets = useSafeAreaInsets();
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const { agents } = useAgentsState();
  const { startCall } = useStartCall();

  React.useEffect(() => {
    if (isVisible && call) {
      logger.debug('[CallInfoSheet] 📞 Call info sheet opened:', {
        callId: call.id,
        agentId: call.agentId,
        agentName: call.agentName,
        duration: call.duration,
        status: call.status,
        hasSummary: !!call.summary,
        summaryLength: call.summary?.length || 0,
        hasInsights: !!call.insights,
        topics: call.insights?.topics || [],
        memoryExtracted: call.memoryExtracted,
      });
    }
  }, [isVisible, call]);

  if (!call) return null;

  const agent = agents.find(a => a.id === call.agentId);
  if (agent) {
    logger.debug('[CallInfoSheet] ✓ Found agent from provider:', agent.name);
  }

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  /**
   * Get the appropriate summary text based on call state
   * Handles: real summary, processing state, missed calls, and legacy calls
   */
  const getSummaryContent = (): { text: string; isPlaceholder: boolean } => {
    // Handle non-completed statuses
    if (call.status === 'missed' || call.status === 'declined') {
      return {
        text: "Call was missed. You can try calling again or send a message to schedule another conversation.",
        isPlaceholder: true,
      };
    }

    if (call.status === 'in_progress') {
      return {
        text: "Call is currently in progress...",
        isPlaceholder: true,
      };
    }

    if (call.status === 'failed') {
      return {
        text: "This call could not be completed. Please try again.",
        isPlaceholder: true,
      };
    }

    // Call is completed - check for real summary
    if (call.summary) {
      return {
        text: call.summary,
        isPlaceholder: false,
      };
    }

    // No summary yet - check if still processing
    if (call.status === 'completed' && !call.memoryExtracted) {
      return {
        text: "Summary is being generated...",
        isPlaceholder: true,
      };
    }

    // Legacy call or processing failed - show fallback
    return {
      text: `${formatDuration(call.duration)} call with ${call.agentName}. Summary not available for this call.`,
      isPlaceholder: true,
    };
  };

  const summaryContent = getSummaryContent();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[
        callInfoSheetStyles.modal.overlay,
        agent?.colors && {
          backgroundColor: `${agent.colors.primary}40`,
        }
      ]}>
        <TouchableOpacity
          style={callInfoSheetStyles.modal.touchableOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[
          callInfoSheetStyles.modal.content,
          { paddingBottom: insets.bottom || 20 },
          theme && { backgroundColor: theme.modal.background }
        ]}>
          {/* Handle Bar */}
          <View style={[
            callInfoSheetStyles.modal.handleBar,
            theme && { backgroundColor: theme.modal.handleBar }
          ]} />

          {/* Header */}
          <View style={callInfoSheetStyles.header.container}>
            <View style={callInfoSheetStyles.header.textGroup}>
              <Text style={[
                callInfoSheetStyles.header.title,
                theme && { color: theme.modal.headerTitle }
              ]}>
                Call Details
              </Text>
              <Text style={[
                callInfoSheetStyles.header.subtitle,
                theme && { color: theme.modal.headerSubtitle }
              ]}>
                {formatDate(call.timestamp)} at {formatTime(call.timestamp)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                callInfoSheetStyles.header.closeButton,
                theme && { backgroundColor: theme.modal.closeButtonBackground }
              ]}
            >
              <Ionicons name="close" size={20} color={theme?.modal.closeButtonIcon || ColorPalette.brand.charcoal} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={callInfoSheetStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Agent Info */}
            <View style={callInfoSheetStyles.agentInfo.container}>
              <View style={callInfoSheetStyles.agentInfo.avatarContainer}>
                <Avatar
                  src={{ uri: call.agentAvatar }}
                  size="lg"
                  fallback={call.agentName.charAt(0)}
                />
              </View>
              <Text style={[
                callInfoSheetStyles.agentInfo.name,
                theme && { color: theme.modal.headerTitle }
              ]}>
                {call.agentName}
              </Text>
            </View>

            {/* Call Info Card */}
            <View style={[
              callInfoSheetStyles.callInfoCard.container,
              theme && { backgroundColor: theme.modal.itemBackground, borderColor: theme.modal.itemBorder }
            ]}>
              <View style={[
                callInfoSheetStyles.callInfoCard.row,
                callInfoSheetStyles.callInfoCard.rowWithMargin
              ]}>
                <Text style={[
                  callInfoSheetStyles.callInfoCard.label,
                  theme && { color: theme.modal.itemDescription }
                ]}>
                  Duration
                </Text>
                <Text style={[
                  callInfoSheetStyles.callInfoCard.value,
                  theme && { color: theme.modal.itemTitle }
                ]}>
                  {formatDuration(call.duration)}
                </Text>
              </View>

              <View style={callInfoSheetStyles.callInfoCard.row}>
                <Text style={[
                  callInfoSheetStyles.callInfoCard.label,
                  theme && { color: theme.modal.itemDescription }
                ]}>
                  Status
                </Text>
                <View style={callInfoSheetStyles.callInfoCard.statusRow}>
                  <View style={[
                    callInfoSheetStyles.callInfoCard.statusDot,
                    call.status === 'missed'
                      ? callInfoSheetStyles.callInfoCard.statusDotMissed
                      : [
                          callInfoSheetStyles.callInfoCard.statusDotCompleted,
                          agent?.colors && { backgroundColor: agent.colors.primary }
                        ]
                  ]} />
                  <Text style={[
                    callInfoSheetStyles.callInfoCard.value,
                    theme && { color: theme.modal.itemTitle }
                  ]}>
                    {call.status === 'missed' ? 'Missed' : 'Completed'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Summary - Accordion */}
            <TouchableOpacity
              style={[
                callInfoSheetStyles.summaryCard.container,
                theme && { backgroundColor: theme.modal.itemBackground, borderColor: theme.modal.itemBorder }
              ]}
              onPress={() => setIsSummaryExpanded(!isSummaryExpanded)}
              activeOpacity={0.7}
            >
              <View style={callInfoSheetStyles.summaryCard.header}>
                <View style={callInfoSheetStyles.summaryCard.headerLeft}>
                  <Ionicons
                    name={summaryContent.isPlaceholder ? "time-outline" : "document-text-outline"}
                    size={18}
                    color={theme?.calls.ctaButtonBackground || ColorPalette.brand.serenityBlue}
                  />
                  <Text style={[
                    callInfoSheetStyles.summaryCard.title,
                    theme && { color: theme.modal.itemTitle }
                  ]}>
                    Summary
                  </Text>
                </View>
                <Ionicons
                  name={isSummaryExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme?.modal.itemDescription || "#8E8E93"}
                />
              </View>
              <Text
                style={[
                  callInfoSheetStyles.summaryCard.text,
                  theme && { color: theme.modal.itemDescription },
                  summaryContent.isPlaceholder && { fontStyle: 'italic' }
                ]}
                numberOfLines={isSummaryExpanded ? undefined : 2}
              >
                {summaryContent.text}
              </Text>

              {/* Show topics if available and expanded */}
              {isSummaryExpanded && call.insights?.topics && call.insights.topics.length > 0 && (
                <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {call.insights.topics.map((topic, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: agent?.colors?.primary
                          ? `${agent.colors.primary}20`
                          : (theme?.modal.itemBackground || '#F0F0F5'),
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: agent?.colors?.primary || theme?.modal.itemTitle || '#333',
                        }}
                      >
                        {topic}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>

            {/* Actions */}
            <View style={callInfoSheetStyles.actions.container}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  startCall(call.agentId);
                }}
                style={[
                  callInfoSheetStyles.actions.callAgainButton,
                  agent?.colors && {
                    backgroundColor: agent.colors.primary,
                    borderColor: agent.colors.primary,
                  }
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" />
                <Text style={callInfoSheetStyles.actions.callAgainButtonText}>
                  Call Again
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  router.push(ROUTES.CHAT_WITH_AGENT(call.agentId));
                }}
                style={[
                  callInfoSheetStyles.actions.messageButton,
                  agent?.colors && { borderColor: agent.colors.primary },
                  theme && { backgroundColor: theme.modal.dismissButtonBackground, borderColor: theme.modal.dismissButtonBorder }
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color={agent?.colors?.primary || theme?.modal.dismissButtonText || ColorPalette.brand.charcoal}
                />
                <Text style={[
                  callInfoSheetStyles.actions.messageButtonText,
                  agent?.colors && { color: agent.colors.primary },
                  theme && { color: theme.modal.dismissButtonText }
                ]}>
                  Send Message
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export { CallInfoSheet };
