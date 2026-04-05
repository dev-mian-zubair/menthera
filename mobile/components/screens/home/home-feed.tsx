import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StatusBar,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useAgentsState, useAgentsActions, useAgentPreferencesContext } from '@/providers';
import { usePaywall } from '@/hooks/usePaywall';
import { useSubscription } from '@/hooks/useSubscription';
import { useStartCall } from '@/hooks/useStartCall';
import { useEngagement } from '@/providers/EngagementProvider';
import { homeFeedStyles } from '@/lib/styles/components/home-feed.styles';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { ROUTES } from '@/lib/routes';
import { Agent } from '@/lib/types';
import { RecentActivitySection } from '@/components/screens/home/RecentActivitySection';
import { FloatingDecorations } from '@/components/screens/home/FloatingDecorations';
import { MoodCheckIn } from '@/components/screens/home/MoodCheckIn';
import { JourneyCard } from '@/components/screens/home/JourneyCard';
import { Avatar } from '@/components/common/Avatar';
import CallSvg from '@/assets/svgs/call.svg';
import ChatSvg from '@/assets/svgs/chat.svg';
import { logger } from '@/lib/utils/logger';

// ============================================
// HELPERS
// ============================================

const getFirstName = (fullName: string | null | undefined): string => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

// ============================================
// HEADER STYLES
// ============================================

const headerStyles = {
  container: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 12,
  } as ViewStyle,

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  } as ViewStyle,

  greetingContainer: {
    flex: 1,
  } as ViewStyle,

  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  } as ViewStyle,

  greetingText: {
    fontSize: 30,
    fontFamily: 'SFProDisplayBold',
    color: '#1F2937',
    letterSpacing: -0.5,
  } as TextStyle,

  greetingEmoji: {
    fontSize: 28,
  } as TextStyle,

  userName: {
    fontSize: 30,
    fontFamily: 'SFProDisplayBold',
    letterSpacing: -0.5,
  } as TextStyle,

  subtitle: {
    fontSize: 15,
    fontFamily: 'SFProDisplayRegular',
    color: '#6B7280',
    marginTop: 6,
  } as TextStyle,

  settingsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  } as ViewStyle,

  profileButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
  } as ViewStyle,

  // Quick Actions - Glassmorphic Style
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  } as ViewStyle,

  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
  } as ViewStyle,

  quickActionText: {
    fontSize: 15,
    fontFamily: 'SFProDisplaySemibold',
  } as TextStyle,

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 12,
    marginBottom: 16,
  } as ViewStyle,

  sectionTitle: {
    fontSize: 18,
    fontFamily: 'SFProDisplaySemibold',
    color: '#1F2937',
    letterSpacing: -0.3,
  } as TextStyle,

  seeAllText: {
    fontSize: 14,
    fontFamily: 'SFProDisplayMedium',
    color: '#5A86FF',
  } as TextStyle,
};

interface HomeFeedProps {
  topInset?: number;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ topInset = 0 }) => {
  const { user } = useUser();
  const { agents } = useAgentsState();
  const { fetchAgents } = useAgentsActions();
  const { initializeAgentOrder, preferences, loading: preferencesLoading, selectAgent } = useAgentPreferencesContext();
  const { presentPaywall } = usePaywall();
  const { plan } = useSubscription();
  const { streak } = useEngagement();
  const { startCall } = useStartCall();

  // Get time-aware theme
  const theme = useMemo(() => getTimeTheme(), []);
  const firstName = getFirstName(user?.fullName);

  // Initialize agent order on first load (after preferences are loaded)
  React.useEffect(() => {
    if (agents && agents.length > 0 && !preferencesLoading) {
      initializeAgentOrder(agents.map(a => a.id));
    }
  }, [agents && agents.length > 0 ? agents[0]?.id : null, preferencesLoading, initializeAgentOrder]);

  // Get visible agents (backend handles ordering)
  const visibleAgents = useMemo(() => {
    if (!agents || agents.length === 0) {
      return [];
    }

    // Filter agents: show only visible ones
    const hiddenIds = preferences.hiddenAgentIds || [];
    return agents.filter(agent => !hiddenIds.includes(agent.id));
  }, [agents, preferences.hiddenAgentIds]);

  // Handle upgrade action - directly open paywall
  const handleUpgradePress = async (agent: Agent) => {
    try {
      logger.debug('[HomeFeed] Opening paywall for locked agent:', agent.name);
      const result = await presentPaywall();
      logger.debug('[HomeFeed] Paywall result:', result);

      if (result.success) {
        logger.debug('[HomeFeed] Purchase successful!');
        await fetchAgents();
        logger.debug('[HomeFeed] Agents refetched - UI should now show unlocked agents');
      }
    } catch (error) {
      logger.error('[HomeFeed] Error showing paywall:', error);
    }
  };

  // Handle mood selection
  const handleMoodSelect = (mood: string) => {
    logger.debug('[HomeFeed] Mood selected:', mood);
    // Future: Send to analytics/backend
  };

  // ============================================
  // AGENT CARD COMPONENT - HORIZONTAL COMPACT DESIGN
  // ============================================
  const AgentCard = ({ agent }: { agent: Agent }) => {
    const questStatus = agent.personalization?.status || 'not_started';
    const ctaText = agent.personalization?.ctaText;
    const isPersonalized = questStatus === 'completed';
    // Note: questProgress would be available from API in future
    const questProgress = 0;

    // Animation values for press feedback
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    const handleCardPress = async () => {
      if (agent.isLocked) {
        handleUpgradePress(agent);
        return;
      }
      await selectAgent(agent.id);
      router.push(ROUTES.AGENT(agent.id));
    };

    const handleChatPress = async (e: any) => {
      e.stopPropagation();
      if (agent.isLocked) {
        handleUpgradePress(agent);
        return;
      }
      await selectAgent(agent.id);
      router.push(ROUTES.CHAT_WITH_AGENT(agent.id));
    };

    const handleCallPress = async (e: any) => {
      e.stopPropagation();
      if (agent.isLocked) {
        handleUpgradePress(agent);
        return;
      }
      await selectAgent(agent.id);
      startCall(agent.id);
    };

    const handleQuestPress = async (e: any) => {
      e.stopPropagation();
      if (agent.isLocked) {
        handleUpgradePress(agent);
        return;
      }
      await selectAgent(agent.id);
      if (questStatus === 'completed' && agent.personalization?.reportReady) {
        router.push(ROUTES.QUEST_REPORT(agent.id));
      } else {
        router.push(ROUTES.QUEST(agent.id));
      }
    };

    // Get agent accent color or default
    const accentColor = agent.colors?.primary || '#5A86FF';
    const lightColor = agent.colors?.light || '#E0EAFF';

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={handleCardPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View
            style={[
              homeFeedStyles.agentCard.container,
              {
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: theme.glass.cardBorder,
              }
            ]}
          >
            {/* Main card content */}
            <View style={homeFeedStyles.agentCard.cardContent}>
              {/* Left section: Avatar + Name + Specialty */}
              <View style={homeFeedStyles.agentCard.avatarSection}>
                <View style={[
                  homeFeedStyles.agentCard.avatarContainer,
                  { borderColor: `${accentColor}30` }
                ]}>
                  <Avatar avatar={agent.avatar} size={56} />
                </View>
                {/* Online indicator - only show when not locked */}
                {!agent.isLocked && (
                  <View style={homeFeedStyles.agentCard.onlineIndicator} />
                )}

                {/* Name below avatar */}
                <Text
                  style={[
                    homeFeedStyles.agentCard.name,
                    { color: theme.card.nameColor }
                  ]}
                  numberOfLines={1}
                >
                  {agent.name}
                </Text>

                {/* Specialty badge below name */}
                {agent.specialties && agent.specialties.length > 0 && (
                  <View style={[
                    homeFeedStyles.agentCard.specialtyBadge,
                    { backgroundColor: lightColor }
                  ]}>
                    <Text style={[
                      homeFeedStyles.agentCard.domainText,
                      { color: accentColor }
                    ]}>
                      {agent.specialties[0]}
                    </Text>
                  </View>
                )}
              </View>

              {/* Right section: Description + Buttons */}
              <View style={homeFeedStyles.agentCard.infoSection}>
                {/* Description (2 lines max) */}
                <Text
                  style={[
                    homeFeedStyles.agentCard.description,
                    { color: theme.card.descriptionColor }
                  ]}
                  numberOfLines={3}
                >
                  {agent.teaser || agent.description}
                </Text>

                {/* Action Buttons */}
                <View style={homeFeedStyles.agentCard.actions}>
                  {agent.isLocked ? (
                    /* Unlock button for locked agents */
                    <TouchableOpacity
                      style={[
                        homeFeedStyles.agentCard.primaryButton,
                        {
                          backgroundColor: accentColor,
                          flex: 2,
                          shadowColor: accentColor,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.35,
                          shadowRadius: 8,
                          elevation: 4,
                        }
                      ]}
                      onPress={handleChatPress}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="lock-open-outline" size={16} color="#FFFFFF" />
                      <Text style={homeFeedStyles.agentCard.primaryButtonText}>
                        Unlock
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    /* Chat and Call buttons for unlocked agents */
                    <>
                      <TouchableOpacity
                        style={[
                          homeFeedStyles.agentCard.primaryButton,
                          { backgroundColor: accentColor }
                        ]}
                        onPress={handleChatPress}
                        activeOpacity={0.8}
                      >
                        <ChatSvg width={16} height={16} color="#FFFFFF" />
                        <Text style={homeFeedStyles.agentCard.primaryButtonText}>
                          Chat
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          homeFeedStyles.agentCard.secondaryButton,
                          { backgroundColor: lightColor }
                        ]}
                        onPress={handleCallPress}
                        activeOpacity={0.8}
                      >
                        <CallSvg width={16} height={16} color={accentColor} />
                        <Text style={[
                          homeFeedStyles.agentCard.secondaryButtonText,
                          { color: accentColor }
                        ]}>
                          Call
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Quest/Personalization CTA at bottom */}
                {ctaText && (
                  isPersonalized ? (
                    <View style={homeFeedStyles.agentCard.badge}>
                      <Ionicons name="checkmark-circle" size={12} color="#059669" />
                      <Text style={homeFeedStyles.agentCard.badgeText}>
                        {ctaText}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={homeFeedStyles.agentCard.questCta}
                      onPress={handleQuestPress}
                    >
                      <Ionicons name="sparkles" size={12} color={theme.sectionLinkColor} />
                      <Text style={[
                        homeFeedStyles.agentCard.questCtaText,
                        { color: theme.sectionLinkColor }
                      ]}>
                        {ctaText}
                      </Text>
                    </TouchableOpacity>
                  )
                )}

                {/* Quest Progress Bar (if in progress) */}
                {questStatus === 'in_progress' && questProgress > 0 && (
                  <View style={homeFeedStyles.agentCard.questProgress}>
                    <View
                      style={[
                        homeFeedStyles.agentCard.questProgressFill,
                        {
                          width: `${questProgress}%`,
                          backgroundColor: accentColor,
                        }
                      ]}
                    />
                  </View>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={theme.gradientColors}
      style={homeFeedStyles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar
        barStyle={theme.isNightMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.gradientColors[0]}
      />

      {/* Floating Decorations - Background Orbs */}
      <FloatingDecorations
        colors={theme.floating}
        showBreathingOrb={true}
        breathingOrbColor={theme.hero.breathingOrb}
      />

      {/* Fixed status bar background to prevent transparency when scrolling */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: topInset,
          backgroundColor: theme.gradientColors[0],
          zIndex: 1,
        }}
      />

      {/* Scrollable Content */}
      <ScrollView
        style={homeFeedStyles.scrollView}
        contentContainerStyle={homeFeedStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section - Personalized Greeting */}
        <View style={[headerStyles.container, { paddingTop: topInset + 8 }]}>
          <View style={headerStyles.topRow}>
            <View style={headerStyles.greetingContainer}>
              <View style={headerStyles.greetingRow}>
                <Text style={[headerStyles.greetingText, { color: theme.textColor }]}>
                  {theme.text}
                </Text>
                <Text style={headerStyles.greetingEmoji}>{theme.emoji}</Text>
              </View>
              {firstName && (
                <Text style={[headerStyles.userName, { color: theme.userNameColor }]}>{firstName}</Text>
              )}
              <Text style={[headerStyles.subtitle, { color: theme.subtitleColor }]}>
                {theme.subtitle}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={[
                headerStyles.profileButton,
                {
                  backgroundColor: theme.glass.cardBackground,
                  borderColor: theme.glass.cardBorder,
                }
              ]}
              activeOpacity={0.7}
            >
              {user?.imageUrl ? (
                <Avatar avatar={user.imageUrl} size={40} />
              ) : (
                <Ionicons name="person-circle-outline" size={40} color={theme.textColor} />
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Actions - Glassmorphic Buttons */}
          <View style={headerStyles.quickActionsContainer}>
            <TouchableOpacity
              style={[
                headerStyles.quickAction,
                {
                  backgroundColor: theme.quickAction.primaryBackground,
                  borderColor: 'transparent',
                }
              ]}
              onPress={() => {
                if (visibleAgents.length > 0) {
                  const firstAgent = visibleAgents[0];
                  selectAgent(firstAgent.id);
                  startCall(firstAgent.id);
                }
              }}
              activeOpacity={0.8}
            >
              <CallSvg width={20} height={20} color={theme.quickAction.primaryIconColor} />
              <Text style={[
                headerStyles.quickActionText,
                { color: theme.quickAction.primaryTextColor }
              ]}>
                Quick Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                headerStyles.quickAction,
                {
                  backgroundColor: theme.quickAction.secondaryBackground,
                  borderColor: theme.glass.cardBorder,
                }
              ]}
              onPress={() => {
                if (visibleAgents.length > 0) {
                  const firstAgent = visibleAgents[0];
                  selectAgent(firstAgent.id);
                  router.push(ROUTES.CHAT_WITH_AGENT(firstAgent.id));
                }
              }}
              activeOpacity={0.8}
            >
              <ChatSvg width={20} height={20} color={theme.quickAction.secondaryIconColor} />
              <Text style={[
                headerStyles.quickActionText,
                { color: theme.quickAction.secondaryTextColor }
              ]}>Start Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mood Check-In Card */}
        <MoodCheckIn
          theme={theme}
          onMoodSelect={handleMoodSelect}
        />

        {/* Journey Card - Simplified Progress */}
        <JourneyCard theme={theme} />

        {/* Recent Activity Section - Continue Conversation */}
        <RecentActivitySection
          onContinue={async (agentId) => {
            await selectAgent(agentId);
            router.push(ROUTES.CHAT_WITH_AGENT(agentId));
          }}
        />

        {/* Section Header for Coaches */}
        <View style={headerStyles.sectionHeader}>
          <Text style={[headerStyles.sectionTitle, { color: theme.sectionTitleColor }]}>
            Your Coaches
          </Text>
        </View>

        {/* Agent Cards List */}
        <View style={homeFeedStyles.agentsList}>
          {visibleAgents.length > 0 ? (
            visibleAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))
          ) : (
            <View style={homeFeedStyles.emptyState.container}>
              <View style={[
                homeFeedStyles.emptyState.iconContainer,
                theme.isNightMode && { backgroundColor: 'rgba(255,255,255,0.1)' }
              ]}>
                <Ionicons
                  name="person-add-outline"
                  size={40}
                  color={theme.isNightMode ? '#A5B4FC' : '#9CA3AF'}
                />
              </View>
              <Text style={[
                homeFeedStyles.emptyState.title,
                theme.isNightMode && { color: '#FFFFFF' }
              ]}>
                {agents.length === 0 ? 'No Coaches Available' : 'All Coaches Hidden'}
              </Text>
              <Text style={[
                homeFeedStyles.emptyState.message,
                theme.isNightMode && { color: '#C7D2FE' }
              ]}>
                {agents.length === 0
                  ? 'Check back later for new AI coaches'
                  : 'Tap the settings icon to show hidden coaches'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};
