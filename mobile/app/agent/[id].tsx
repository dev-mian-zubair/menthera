import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Theme';
import { useAgentsActions } from '@/providers';
import { useStartCall } from '@/hooks/useStartCall';
import { ROUTES } from '@/lib/routes';
import BackSvg from '@/assets/svgs/back.svg';
import { Avatar } from '@/components/common/Avatar';
import { AnimatedAnimalAvatar, hasAnimatedVersion } from '@/components/animations/AnimatedAnimalAvatar';
import { ReportNotificationCard } from '@/components/chat/ReportNotificationCard';
import { getTimeTheme } from '@/lib/utils/time-theme';

export default function AgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAgentById } = useAgentsActions();
  const { startCall } = useStartCall();
  const insets = useSafeAreaInsets();
  const theme = useMemo(() => getTimeTheme(), []);

  // Get the specific agent using the context helper
  const agent = getAgentById(id!);

  if (!agent) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.agentDetail.background, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />
        <Text style={{ fontSize: 18, color: theme.agentDetail.notFoundText }}>
          Agent not found
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontFamily: 'SFProDisplayMedium', color: theme.agentDetail.notFoundLink }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleStartChat = () => {
    router.push(ROUTES.CHAT_WITH_AGENT(agent.id));
  };

  const handleStartCall = () => {
    // Request permissions then navigate to call screen
    startCall(agent.id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.agentDetail.background }}>
      <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{
        backgroundColor: theme.agentDetail.background,
        paddingHorizontal: 24,
        paddingVertical: 12,
        paddingTop: insets.top + 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
          >
            <BackSvg width={24} height={24} color={theme.agentDetail.backIcon} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 18,
            fontFamily: 'SFProDisplaySemibold',
            color: theme.agentDetail.headerTitle,
            flex: 1,
          }}>
            Expert Profile
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Agent Profile Card */}
        <View style={{ marginHorizontal: 24, marginTop: 24 }}>
          <View style={{ borderRadius: 28, backgroundColor: theme.agentDetail.cardBackground, overflow: 'hidden' }}>
            {/* Avatar */}
            <View style={{
              width: '100%',
              height: 280,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: agent.colors?.light || (theme.isNightMode ? 'rgba(99, 102, 241, 0.2)' : '#F5F5F5'),
            }}>
              {hasAnimatedVersion(agent.avatar) ? (
                <AnimatedAnimalAvatar
                  avatar={agent.avatar}
                  size={200}
                  isActive={true}
                />
              ) : (
                <Avatar
                  avatar={agent.avatar}
                  size={200}
                />
              )}
            </View>

            {/* Info Section */}
            <View style={{ padding: 24 }}>
              {/* Name */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{
                  fontSize: 24,
                  fontFamily: 'SFProDisplayBold',
                  color: theme.agentDetail.agentName,
                }}>
                  {agent.name}
                </Text>
              </View>

              {/* Specialty */}
              <Text style={{
                fontSize: 14,
                fontFamily: 'SFProDisplayRegular',
                color: theme.agentDetail.specialty,
                marginBottom: 16,
              }}>
                {agent.specialties[0]}
              </Text>

              {/* Description */}
              <Text style={{
                fontSize: 14,
                fontFamily: 'SFProDisplayRegular',
                color: theme.agentDetail.description,
                marginBottom: 24,
                lineHeight: 20,
              }}>
                {agent.description}
              </Text>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', width: '100%', gap: 8 }}>
                <TouchableOpacity
                  onPress={handleStartChat}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    backgroundColor: theme.agentDetail.chatButtonBackground,
                    borderRadius: 24,
                  }}
                >
                  <Ionicons name="chatbubble" size={14} color={agent.colors ? agent.colors.primary : theme.quickAction.primaryBackground} />
                  <Text style={{
                    fontSize: 12,
                    fontFamily: 'SFProDisplaySemibold',
                    color: theme.agentDetail.chatButtonText,
                    marginLeft: 6,
                  }}>
                    Chat
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStartCall}
                  activeOpacity={0.7}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    backgroundColor: agent.colors ? agent.colors.primary : theme.quickAction.primaryBackground,
                    borderRadius: 24,
                  }}
                >
                  <Ionicons name="call" size={14} color="#FFFFFF" />
                  <Text style={{
                    fontSize: 12,
                    fontFamily: 'SFProDisplaySemibold',
                    color: '#FFFFFF',
                    marginLeft: 6,
                  }}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Personalization Report Card */}
        {agent.personalization?.reportReady && agent.personalization.reportInfo && (
          <View style={{ marginHorizontal: 24, marginTop: 24 }}>
            <Text style={{
              fontSize: 16,
              fontFamily: 'SFProDisplaySemibold',
              color: theme.agentDetail.sectionTitle,
              marginBottom: 12,
            }}>
              Your Personalization Report
            </Text>
            <ReportNotificationCard
              agentId={agent.id}
              sessionId={agent.personalization.sessionId || ''}
              title={agent.personalization.reportInfo.title}
              shortDescription={agent.personalization.reportInfo.shortDescription}
              icon={agent.personalization.reportInfo.icon}
              completedAt={agent.personalization.completedAt}
              showTimestamp={false}
              noPadding={true}
              buttonText="View Full Report"
              onPress={() => {
                router.push({
                  pathname: '/quest-report/[agentId]',
                  params: { agentId: agent.id },
                });
              }}
            />
          </View>
        )}

        {/* All Specialties Card */}
        {agent.specialties.length > 1 && (
          <View style={{ marginHorizontal: 24, marginTop: 24 }}>
            <View style={{ padding: 24, borderRadius: 28, backgroundColor: theme.agentDetail.cardBackground }}>
              <Text style={{
                fontSize: 16,
                fontFamily: 'SFProDisplaySemibold',
                color: theme.agentDetail.sectionTitle,
                marginBottom: 16,
              }}>
                All Specialties
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {agent.specialties.map((specialty, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: agent.colors ? `${agent.colors.light}40` : `${theme.quickAction.primaryBackground}15`,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontFamily: 'SFProDisplayMedium',
                      color: agent.colors ? agent.colors.primary : theme.quickAction.primaryBackground,
                    }}>
                      {specialty}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
