import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, BackHandler, AppState, AppStateStatus, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { useAgentsState } from '@/providers/AgentsProvider';
import { useInitiateCall } from '@/hooks';
import { useDaily } from '@/hooks';
import { callStyles } from '@/lib/styles/screens/detail/call.styles';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { AudioReactiveOrb, OrbState } from '@/components/animations/AudioReactiveOrb';
import { PulsingAvatar } from '@/components/animations/PulsingAvatar';
import { logger } from '@/lib/utils/logger';
import { API_CONFIG } from '@/lib/api/config';

export default function CallScreen() {
  const { agentId } = useLocalSearchParams<{ agentId: string }>();
  const { agents } = useAgentsState();
  const agent = agents.find(a => a.id === agentId);
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = useMemo(() => getTimeTheme(), []);
  const callTheme = theme.calls;

  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const isInitializingRef = useRef(false);

  // Reanimated values for entrance/exit animations
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);
  const controlsTranslateY = useSharedValue(200);
  const avatarOpacity = useSharedValue(0);

  // API hook
  const { initiateCall, loading: isInitiatingCall, error: initiateError } = useInitiateCall();

  // Daily.co
  const { state: dailyState, joinRoom, leaveRoom, toggleAudio, setSpeaker } = useDaily({
    onJoined: () => logger.debug('[CallScreen] ✓ Joined Daily.co room'),
    onLeft: () => logger.debug('[CallScreen] ✓ Left Daily.co room'),
    onError: (error) => {
      logger.error('[CallScreen] ✗ Daily.co error:', error);
      setErrorMessage(error);
    },
  });

  // Orb intensity driven by Daily's audioLevel (covers both local mic and remote audio)
  const orbIntensity = useSharedValue(0);

  // Determine orb state from call state
  const orbState: OrbState = useMemo(() => {
    if (dailyState.status === 'connected') {
      if (dailyState.audioLevel > 0.1) return 'speaking';
      return 'listening';
    }
    if (dailyState.status === 'joining' || isInitiatingCall) return 'connecting';
    return 'idle';
  }, [dailyState.status, dailyState.audioLevel, isInitiatingCall]);

  // Smoothly drive orb intensity from Daily's audioLevel
  useEffect(() => {
    if (dailyState.status === 'connected') {
      orbIntensity.value = withTiming(dailyState.audioLevel, { duration: 100 });
    } else {
      orbIntensity.value = withTiming(0, { duration: 300 });
    }
  }, [dailyState.audioLevel, dailyState.status]);

  // Backend notification helper with retry logic
  // Retries up to 3 times, stores to AsyncStorage on final failure for cleanup on next app launch
  const notifyBackendUserLeft = useCallback(async () => {
    if (!callSessionId) return;

    const maxRetries = 3;
    const retryDelayMs = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        logger.debug(`[CallScreen] Notifying backend that user left call (attempt ${attempt + 1}/${maxRetries}):`, callSessionId);
        const token = await getToken();
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || API_CONFIG.BASE_URL}/call/${callSessionId}/user-left`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          logger.debug('[CallScreen] ✓ Backend notified successfully');
          return; // Success - exit retry loop
        }

        logger.warn(`[CallScreen] Backend notification failed with status ${response.status}`);
      } catch (error) {
        logger.warn(`[CallScreen] Attempt ${attempt + 1} failed:`, error);

        if (attempt === maxRetries - 1) {
          // Final attempt failed - store callSessionId for cleanup on next app launch
          try {
            await AsyncStorage.setItem('pendingCallEnd', callSessionId);
            logger.debug('[CallScreen] ⚠️ Stored pending call end for cleanup on next launch');
          } catch (storageError) {
            logger.warn('[CallScreen] Failed to store pending call end:', storageError);
          }
          return;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
  }, [callSessionId, getToken]);

  // Initialize call
  // Note: Permissions are now checked BEFORE navigating to this screen via useStartCall hook
  // BYOK gate ensures user has active subscription + API key
  useEffect(() => {
    const initializeCall = async () => {
      if (isInitializingRef.current) return;
      if (!agentId) { setErrorMessage('Agent ID not found'); return; }

      try {
        isInitializingRef.current = true;
        const session = await initiateCall({ agentId, type: 'audio' });
        if (!session) {
          setErrorMessage(initiateError || 'Failed to initiate call');
          isInitializingRef.current = false;
          return;
        }
        setCallSessionId(session.id);
        const joined = await joinRoom(session.roomUrl, session.token);
        if (!joined) {
          setErrorMessage('Failed to join call room');
        }
      } catch (error: any) {
        const msg = error instanceof Error ? error.message : 'Failed to initiate call';
        setErrorMessage(msg);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeCall();

    return () => {
      const currentStatus = dailyState.status;
      if (currentStatus === 'connected' || currentStatus === 'joining') {
        leaveRoom();
        notifyBackendUserLeft();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, retryTrigger]);

  // Call duration timer
  useEffect(() => {
    if (dailyState.status === 'connected') {
      const interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [dailyState.status]);

  // Back button handling
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dailyState.status === 'joining' || isInitiatingCall) return true;
      return false;
    });
    return () => backHandler.remove();
  }, [dailyState.status, isInitiatingCall]);

  // App backgrounding
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && dailyState.status === 'connected') {
        try {
          await leaveRoom();
          notifyBackendUserLeft();
        } catch (error) {
          logger.error('[CallScreen] Error ending call on background:', error);
        }
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [dailyState.status, leaveRoom, notifyBackendUserLeft]);

  // Entrance animations
  useEffect(() => {
    if (dailyState.status === 'connected') {
      contentOpacity.value = withTiming(1, { duration: 400 });
      contentTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
      avatarOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
      controlsTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
    } else if (dailyState.status === 'joining' || isInitiatingCall) {
      contentOpacity.value = withTiming(1, { duration: 300 });
      contentTranslateY.value = withTiming(0, { duration: 300 });
      controlsTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      contentOpacity.value = 0;
      contentTranslateY.value = 20;
      controlsTranslateY.value = 200;
      avatarOpacity.value = 0;
    }
  }, [dailyState.status, isInitiatingCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    setIsEndingCall(true);
    try {
      // 1. Leave room and destroy Daily instance immediately
      // This stops all audio playback right away
      await leaveRoom();

      // 2. Fire backend notification WITHOUT awaiting
      // This prevents blocking navigation if network is slow/failing
      // The notification includes retry logic and will store to AsyncStorage on final failure
      notifyBackendUserLeft().catch(err => {
        logger.warn('[CallScreen] Background notification failed:', err);
      });

      // 3. Navigate back immediately - don't wait for backend
      router.back();
    } catch (error) {
      logger.error('[CallScreen] Error ending call:', error);
      router.back();
    } finally {
      setIsEndingCall(false);
    }
  };

  const handleBack = () => router.back();

  // Animated styles
  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const avatarAnimStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
  }));

  const controlsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: controlsTranslateY.value }],
  }));

  // ─── NOT FOUND ───
  if (!agent) {
    return (
      <View style={[callStyles.notFound.container, { backgroundColor: callTheme.notFoundBackground }]}>
        <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />
        <View style={[callStyles.notFound.container, { paddingTop: insets.top }]}>
          <Text style={[callStyles.notFound.message, { color: callTheme.notFoundText }]}>Coach not found</Text>
        </View>
      </View>
    );
  }

  // ─── ERROR ───
  if (errorMessage && !isInitiatingCall && dailyState.status !== 'joining' && dailyState.status !== 'connected') {
    return (
      <View style={[callStyles.notFound.container, { backgroundColor: callTheme.callBackground }]}>
        <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />
        <View style={[callStyles.notFound.container, { paddingTop: insets.top }]}>
          <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
            <Ionicons name="alert-circle-outline" size={64} color={callTheme.errorIcon} style={{ marginBottom: 16 }} />
            <Text style={[callStyles.notFound.message, { fontSize: 18, fontWeight: '600', marginBottom: 12, color: callTheme.errorTitle }]}>
              Connection Failed
            </Text>
            <Text style={[callStyles.notFound.message, { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20, color: callTheme.errorMessage }]}>
              {errorMessage}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setErrorMessage(null);
                  isInitializingRef.current = false;
                  setCallDuration(0);
                  setRetryTrigger(prev => prev + 1);
                }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  backgroundColor: callTheme.retryButtonBackground,
                  borderRadius: 100,
                  minWidth: 120,
                }}
              >
                <Text style={{ color: callTheme.retryButtonText, textAlign: 'center', fontSize: 15, fontWeight: '600' }}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBack}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  backgroundColor: callTheme.backButtonBackground,
                  borderRadius: 100,
                  minWidth: 120,
                }}
              >
                <Text style={{ color: callTheme.backButtonText, textAlign: 'center', fontSize: 15, fontWeight: '600' }}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ─── MAIN CALL SCREEN ───
  return (
    <View style={[callStyles.safeArea, { backgroundColor: callTheme.callBackground, paddingTop: insets.top }]}>
      <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />

      {/* Top Bar */}
      <View style={callStyles.topBar.container}>
        {dailyState.status !== 'connected' ? (
          <TouchableOpacity
            onPress={handleBack}
            style={[callStyles.topBar.backButton, { backgroundColor: callTheme.backButtonBackground }]}
            disabled={dailyState.status === 'joining' || isInitiatingCall}
          >
            <Ionicons name="chevron-back" size={24} color={callTheme.buttonIcon} />
          </TouchableOpacity>
        ) : (
          <View style={callStyles.topBar.spacer} />
        )}

        <View style={callStyles.topBar.centerInfo}>
          {dailyState.status === 'connected' ? (
            <Text style={[callStyles.topBar.durationText, { color: callTheme.durationText }]}>
              {formatDuration(callDuration)}
            </Text>
          ) : (dailyState.status === 'joining' || isInitiatingCall) ? (
            <Text style={[callStyles.statusSection.connectingText, { color: callTheme.statusText, marginBottom: 0 }]}>
              Connecting...
            </Text>
          ) : null}
        </View>

        <View style={callStyles.topBar.spacer} />
      </View>

      {/* Content: Orb + Avatar + Agent Info */}
      <View style={callStyles.content}>
        {/* Status text during connecting */}
        {(dailyState.status === 'joining' || isInitiatingCall) && (
          <View style={callStyles.statusSection.container}>
            <Text style={[callStyles.statusSection.connectingText, { color: callTheme.statusText }]}>
              Connecting to your coach...
            </Text>
            <Text style={[callStyles.statusSection.connectingText, { fontSize: 13, marginTop: 4, color: callTheme.statusTextSubtle }]}>
              This may take a moment
            </Text>
          </View>
        )}

        {dailyState.status === 'reconnecting' && (
          <View style={callStyles.statusSection.container}>
            <Text style={[callStyles.statusSection.connectingText, { color: callTheme.quotaTextWarning }]}>
              Reconnecting... ({dailyState.reconnectAttempts}/3)
            </Text>
          </View>
        )}

        {/* Orb + Avatar */}
        <Animated.View style={contentAnimStyle}>
          <View style={callStyles.orbSection.container}>
            <AudioReactiveOrb
              intensity={orbIntensity}
              state={orbState}
              size={callStyles.ORB_SIZE}
              primaryColor={agent.colors?.primary || '#8B7EC8'}
              accentColor={agent.colors?.light || '#6ED7C4'}
            />

            {/* Avatar overlay (centered within orb, appears when connected) */}
            <Animated.View style={[callStyles.orbSection.avatarOverlay, avatarAnimStyle]}>
              <PulsingAvatar
                avatar={agent.avatar}
                size={Math.round(callStyles.ORB_SIZE * 0.45)}
                isActive={dailyState.status === 'connected'}
                audioLevel={dailyState.audioLevel}
                glowColor={agent.colors?.light || callTheme.durationText}
              />
            </Animated.View>
          </View>

          {/* Agent Name */}
          <View style={callStyles.agentInfo.container}>
            <Text style={[callStyles.agentInfo.name, { color: callTheme.agentName }]}>
              {agent.name}
            </Text>
            <Text style={[callStyles.agentInfo.specialty, { color: callTheme.agentSpecialty }]}>
              {agent.specialties?.[0] || 'AI Coach'}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Controls */}
      <Animated.View
        style={[
          callStyles.controls.container,
          { backgroundColor: callTheme.controlsBackground },
          controlsAnimStyle,
        ]}
      >
        <View style={[callStyles.controls.handleBar, { backgroundColor: callTheme.controlsHandleBar }]} />

        <View style={callStyles.controls.buttonsRow}>
          {/* Mute */}
          <TouchableOpacity
            onPress={toggleAudio}
            disabled={dailyState.status !== 'connected'}
            style={[
              callStyles.controls.button,
              { backgroundColor: callTheme.buttonBackground },
              !dailyState.isAudioOn && { backgroundColor: callTheme.muteActiveBackground },
              dailyState.status !== 'connected' && { opacity: 0.5 },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={!dailyState.isAudioOn ? 'mic-off-outline' : 'mic-outline'}
              size={28}
              color={!dailyState.isAudioOn ? callTheme.muteActiveIcon : callTheme.buttonIcon}
            />
          </TouchableOpacity>

          {/* Speaker */}
          <TouchableOpacity
            onPress={() => setSpeaker(!dailyState.isSpeakerOn)}
            disabled={dailyState.status !== 'connected'}
            style={[
              callStyles.controls.button,
              { backgroundColor: callTheme.buttonBackground },
              dailyState.isSpeakerOn && { backgroundColor: callTheme.muteActiveBackground },
              dailyState.status !== 'connected' && { opacity: 0.5 },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={dailyState.isSpeakerOn ? 'volume-high' : 'volume-low-outline'}
              size={28}
              color={dailyState.isSpeakerOn ? callTheme.muteActiveIcon : callTheme.buttonIcon}
            />
          </TouchableOpacity>

          {/* End Call */}
          <TouchableOpacity
            onPress={handleEndCall}
            disabled={isEndingCall || dailyState.status === 'idle'}
            style={[
              callStyles.controls.button,
              { backgroundColor: callTheme.endCallBackground },
              (isEndingCall || dailyState.status === 'idle') && { opacity: 0.5 },
            ]}
            activeOpacity={0.8}
          >
            {isEndingCall ? (
              <ActivityIndicator size="small" color={callTheme.endCallIcon} />
            ) : (
              <Ionicons name="close" size={32} color={callTheme.endCallIcon} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

    </View>
  );
}
