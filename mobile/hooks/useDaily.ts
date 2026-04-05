import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';

// Daily.co requires native build - not available in Expo Go
let Daily: any = null;
try {
  Daily = require('@daily-co/react-native-daily-js').default;
} catch (error) {
  logger.warn('[useDaily] Daily.co module not available. Requires development build.');
}

// Global reference to track if we're currently cleaning up
// This prevents creating a new instance while cleanup is in progress
let isCleaningUp = false;

// Global reference to track all Daily instances (for cleanup)
// Daily.co only allows ONE instance globally
let globalDailyInstance: any = null;

export interface DailyCallState {
  status: 'idle' | 'joining' | 'connected' | 'leaving' | 'error' | 'reconnecting';
  error: string | null;
  isAudioOn: boolean;
  isSpeakerOn: boolean;
  participantCount: number;
  participantNames: string[];
  reconnectAttempts: number;
  audioLevel: number; // 0.0 to 1.0, represents local microphone audio level
}

export interface UseDailyOptions {
  onJoined?: () => void;
  onLeft?: () => void;
  onError?: (error: string) => void;
}

/**
 * Hook to manage Daily.co call connection
 * Handles joining room, leaving room, and managing audio state
 */
export const useDaily = (options: UseDailyOptions = {}) => {
  const dailyCallRef = useRef<any>(null);
  const roomCredentialsRef = useRef<{ url: string; token: string } | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 3;

  // Store handler references for cleanup
  const handlersRef = useRef<{
    joinedMeeting: any;
    leftMeeting: any;
    participantJoined: any;
    participantLeft: any;
    localAudioLevel: any;
    callError: any;
  } | null>(null);

  const [state, setState] = useState<DailyCallState>({
    status: Daily ? 'idle' : 'error',
    error: Daily ? null : 'Daily.co module not available. Requires development build.',
    isAudioOn: true,
    isSpeakerOn: true,
    participantCount: 0,
    participantNames: [],
    reconnectAttempts: 0,
    audioLevel: 0,
  });

  // Reconnection logic with exponential backoff
  const attemptReconnection = useCallback(async () => {
    if (!roomCredentialsRef.current) {
      logger.warn('[useDaily] Cannot reconnect: No room credentials stored');
      return;
    }

    setState(prev => {
      const newAttempts = prev.reconnectAttempts + 1;

      if (newAttempts > maxReconnectAttempts) {
        logger.error('[useDaily] ❌ Max reconnection attempts reached');
        return {
          ...prev,
          status: 'error',
          error: 'Connection lost. Max reconnection attempts reached.'
        };
      }

      // Exponential backoff: 2s, 4s, 8s
      const backoffMs = Math.pow(2, newAttempts) * 1000;
      logger.debug(`[useDaily] 🔄 Reconnection attempt ${newAttempts}/${maxReconnectAttempts} in ${backoffMs}ms...`);

      // Clear previous timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Schedule reconnection with backoff
      reconnectTimeoutRef.current = setTimeout(async () => {
        try {
          logger.debug('[useDaily] Attempting to rejoin room...');
          const { url, token } = roomCredentialsRef.current!;

          // Recreate call instance
          const created = await createCallInstance(url, token);
          if (created && dailyCallRef.current) {
            await dailyCallRef.current.join();
            logger.debug('[useDaily] ✅ Reconnection successful');
            setState(prev => ({ ...prev, reconnectAttempts: 0, status: 'connected', error: null }));
          }
        } catch (error) {
          logger.error('[useDaily] Reconnection failed:', error);
          attemptReconnection(); // Retry
        }
      }, backoffMs);

      return { ...prev, status: 'reconnecting', reconnectAttempts: newAttempts };
    });
  }, [maxReconnectAttempts]);

  // Event handlers - defined first so they can be used by createCallInstance
  const handleJoinedMeeting = useCallback(() => {
    logger.debug('[useDaily] 📞 Joined meeting');
    setState(prev => ({ ...prev, status: 'connected', error: null, reconnectAttempts: 0 }));

    // Start audio level monitoring
    if (dailyCallRef.current) {
      try {
        dailyCallRef.current.startLocalAudioLevelObserver(100); // Update every 100ms
        logger.debug('[useDaily] 🎤 Started audio level monitoring');
      } catch (error) {
        logger.warn('[useDaily] Failed to start audio level monitoring:', error);
      }

      // Route audio to speaker (not earpiece) — critical for audio-only bot calls
      try {
        dailyCallRef.current.setNativeInCallAudioMode('video'); // 'video' = speaker, 'voice' = earpiece
        logger.debug('[useDaily] 🔊 Audio routed to speaker');
      } catch (error) {
        logger.warn('[useDaily] Failed to set audio mode:', error);
      }
    }

    options.onJoined?.();
  }, [options]);

  const handleLeftMeeting = useCallback(() => {
    logger.debug('[useDaily] 📞 Left meeting');
    setState(prev => ({ ...prev, status: 'idle', reconnectAttempts: 0, audioLevel: 0 }));

    // Stop audio level monitoring
    if (dailyCallRef.current) {
      try {
        dailyCallRef.current.stopLocalAudioLevelObserver();
        logger.debug('[useDaily] 🎤 Stopped audio level monitoring');
      } catch (error) {
        logger.warn('[useDaily] Failed to stop audio level monitoring:', error);
      }
    }

    // Clear reconnection timeout on intentional leave
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    options.onLeft?.();
  }, [options]);

  const handleCallError = useCallback((event: any) => {
    const errorMsg = event?.error?.message || event?.message || 'Daily call error occurred';
    const errorType = event?.error?.type || event?.errorMsg || '';

    logger.error('[useDaily] ✗ Call error:', errorMsg, 'Type:', errorType);

    // Check if this is a network/connection error that we can recover from
    const isRecoverableError = errorType.includes('network') ||
                               errorType.includes('connection') ||
                               errorMsg.toLowerCase().includes('network') ||
                               errorMsg.toLowerCase().includes('connection');

    if (isRecoverableError && state.status === 'connected') {
      logger.debug('[useDaily] 🔄 Detected recoverable error, attempting reconnection...');
      attemptReconnection();
    } else {
      setState(prev => ({ ...prev, status: 'error', error: errorMsg }));
      options.onError?.(errorMsg);
    }
  }, [options, attemptReconnection, state.status]);

  const handleParticipantJoined = useCallback((event: any) => {
    const participantName = event?.participant?.user_name || 'Unknown Participant';
    logger.debug('[useDaily] 👤 Participant joined:', participantName);
    setState(prev => ({
      ...prev,
      participantCount: prev.participantCount + 1,
      participantNames: [...prev.participantNames, participantName],
    }));
  }, []);

  const handleParticipantLeft = useCallback((event: any) => {
    const participantName = event?.participant?.user_name || 'Unknown Participant';
    logger.debug('[useDaily] 👤 Participant left:', participantName);
    setState(prev => ({
      ...prev,
      participantCount: Math.max(0, prev.participantCount - 1),
      participantNames: prev.participantNames.filter(name => name !== participantName),
    }));
  }, []);

  const handleLocalAudioLevel = useCallback((event: any) => {
    // event.audioLevel is a value from 0.0 to 1.0
    const level = event?.audioLevel ?? 0;
    setState(prev => ({ ...prev, audioLevel: level }));
  }, []);

  // Create Daily call instance with room URL and token
  const createCallInstance = useCallback(async (roomUrl: string, token: string) => {
    try {
      // Check if Daily is available
      if (!Daily) {
        const errorMsg = 'Daily.co module not available. Requires development build.';
        logger.warn('[useDaily]', errorMsg);
        setState(prev => ({ ...prev, status: 'error', error: errorMsg }));
        return false;
      }

      // Wait if cleanup is in progress
      if (isCleaningUp) {
        logger.warn('[useDaily] Cannot create instance: cleanup in progress');
        return false;
      }

      // Destroy ANY existing Daily instance (global check)
      const instanceToDestroy = dailyCallRef.current || globalDailyInstance;

      if (instanceToDestroy) {
        try {
          logger.debug('[useDaily] Destroying existing Daily instance...');
          isCleaningUp = true;

          // Remove event listeners first if handlers exist
          if (handlersRef.current) {
            try {
              instanceToDestroy.off('joined-meeting', handlersRef.current.joinedMeeting);
              instanceToDestroy.off('left-meeting', handlersRef.current.leftMeeting);
              instanceToDestroy.off('participant-joined', handlersRef.current.participantJoined);
              instanceToDestroy.off('participant-left', handlersRef.current.participantLeft);
              instanceToDestroy.off('local-audio-level', handlersRef.current.localAudioLevel);
              instanceToDestroy.off('error', handlersRef.current.callError);
            } catch (e) {
              logger.warn('[useDaily] Error removing event listeners:', e);
            }
          }

          // Destroy the instance
          instanceToDestroy.destroy();
          dailyCallRef.current = null;
          globalDailyInstance = null;
          handlersRef.current = null;
          logger.debug('[useDaily] ✓ Previous instance destroyed');

          // Wait for Daily to fully clean up before creating new instance
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          logger.warn('[useDaily] Error destroying previous call instance:', e);
          // Force clear refs even if destroy fails
          dailyCallRef.current = null;
          globalDailyInstance = null;
          handlersRef.current = null;
        } finally {
          isCleaningUp = false;
        }
      }

      // Create new Daily call instance with room URL and token
      dailyCallRef.current = Daily.createCallObject({
        url: roomUrl,
        token: token,
        audioSource: true,
        subscribeToTracksAutomatically: true,
        dailyConfig: {
          micAudioMode: 'music',
        },
      });

      // Store globally to track across all hook instances
      globalDailyInstance = dailyCallRef.current;

      logger.debug('[useDaily] ✓ Daily call instance created with room URL');

      // Store handler references for cleanup
      handlersRef.current = {
        joinedMeeting: handleJoinedMeeting,
        leftMeeting: handleLeftMeeting,
        participantJoined: handleParticipantJoined,
        participantLeft: handleParticipantLeft,
        localAudioLevel: handleLocalAudioLevel,
        callError: handleCallError,
      };

      // Subscribe to events
      if (dailyCallRef.current) {
        dailyCallRef.current
          .on('joined-meeting', handleJoinedMeeting)
          .on('left-meeting', handleLeftMeeting)
          .on('participant-joined', handleParticipantJoined)
          .on('participant-left', handleParticipantLeft)
          .on('local-audio-level', handleLocalAudioLevel)
          .on('error', handleCallError);
      }

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to create Daily call';
      logger.error('[useDaily] ✗ Creation error:', errorMsg);
      setState(prev => ({ ...prev, status: 'error', error: errorMsg }));
      return false;
    }
  }, [handleJoinedMeeting, handleLeftMeeting, handleParticipantJoined, handleParticipantLeft, handleLocalAudioLevel, handleCallError]);

  // Join room with URL and token
  const joinRoom = useCallback(async (roomUrl: string, token: string) => {
    try {
      setState(prev => ({ ...prev, status: 'joining', error: null, reconnectAttempts: 0 }));
      logger.debug('[useDaily] 🔄 Joining room...');

      // Store credentials for reconnection
      roomCredentialsRef.current = { url: roomUrl, token };

      // Create call instance with room URL and token
      const created = await createCallInstance(roomUrl, token);
      if (!created || !dailyCallRef.current) {
        setState(prev => ({ ...prev, error: 'Failed to create call instance' }));
        return false;
      }

      // Join the meeting
      await dailyCallRef.current.join();

      logger.debug('[useDaily] ✓ Join completed');
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to join room';
      logger.error('[useDaily] ✗ Join error:', errorMsg);
      setState(prev => ({ ...prev, status: 'error', error: errorMsg }));
      return false;
    }
  }, [createCallInstance]);

  // Leave room and destroy Daily instance immediately
  // This ensures audio stops immediately when user ends call
  const leaveRoom = useCallback(async () => {
    if (!dailyCallRef.current) return false;

    try {
      setState(prev => ({ ...prev, status: 'leaving' }));
      logger.debug('[useDaily] 🔄 Leaving room...');

      // Stop audio monitoring first
      try {
        dailyCallRef.current.stopLocalAudioLevelObserver();
      } catch (e) {
        // Ignore - may already be stopped
      }

      // Leave the room
      await dailyCallRef.current.leave();

      // IMPORTANT: Destroy immediately, don't wait for unmount
      // This stops all audio playback right away
      try {
        if (handlersRef.current) {
          dailyCallRef.current.off('joined-meeting', handlersRef.current.joinedMeeting);
          dailyCallRef.current.off('left-meeting', handlersRef.current.leftMeeting);
          dailyCallRef.current.off('participant-joined', handlersRef.current.participantJoined);
          dailyCallRef.current.off('participant-left', handlersRef.current.participantLeft);
          dailyCallRef.current.off('local-audio-level', handlersRef.current.localAudioLevel);
          dailyCallRef.current.off('error', handlersRef.current.callError);
        }
        dailyCallRef.current.destroy();
        dailyCallRef.current = null;
        globalDailyInstance = null;
        handlersRef.current = null;
        logger.debug('[useDaily] ✓ Daily instance destroyed');
      } catch (e) {
        logger.warn('[useDaily] Error destroying Daily instance:', e);
        // Force clear refs even on error
        dailyCallRef.current = null;
        globalDailyInstance = null;
        handlersRef.current = null;
      }

      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear room credentials
      roomCredentialsRef.current = null;

      setState(prev => ({ ...prev, status: 'idle', error: null, audioLevel: 0 }));
      logger.debug('[useDaily] ✓ Left room and cleaned up');
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to leave room';
      logger.error('[useDaily] ✗ Leave error:', errorMsg);

      // Even on error, try to clean up the instance to stop audio
      try {
        if (dailyCallRef.current) {
          dailyCallRef.current.destroy();
        }
      } catch (e) {
        // Ignore cleanup error
      }
      dailyCallRef.current = null;
      globalDailyInstance = null;
      handlersRef.current = null;

      setState(prev => ({ ...prev, status: 'error', error: errorMsg }));
      return false;
    }
  }, []);

  // Toggle speaker / earpiece
  const setSpeaker = useCallback((enabled: boolean) => {
    if (!dailyCallRef.current) return;
    try {
      dailyCallRef.current.setNativeInCallAudioMode(enabled ? 'video' : 'voice');
      setState(prev => ({ ...prev, isSpeakerOn: enabled }));
      logger.debug('[useDaily] 🔊 Speaker', enabled ? 'on' : 'off');
    } catch (error) {
      logger.error('[useDaily] Error toggling speaker:', error);
    }
  }, []);

  // Toggle audio
  const setAudio = useCallback((enabled: boolean) => {
    if (!dailyCallRef.current) {
      logger.warn('[useDaily] Cannot set audio: Daily instance not initialized');
      return;
    }

    try {
      dailyCallRef.current.setLocalAudio(enabled);
      setState(prev => ({ ...prev, isAudioOn: enabled }));
      logger.debug('[useDaily] 🎤 Audio', enabled ? 'enabled' : 'disabled');
    } catch (error) {
      logger.error('[useDaily] Error toggling audio:', error);
    }
  }, []);

  // Cleanup effect - force immediate cleanup on unmount as a fallback
  // Primary cleanup should happen in leaveRoom(), this is just a safety net
  useEffect(() => {
    return () => {
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear room credentials
      roomCredentialsRef.current = null;

      // Force immediate cleanup on unmount - synchronous, no await
      const instanceToCleanup = dailyCallRef.current || globalDailyInstance;

      if (instanceToCleanup) {
        logger.debug('[useDaily] Force cleanup on unmount (safety net)');
        isCleaningUp = true;

        // Synchronous cleanup - don't await anything
        try {
          // Remove event listeners first
          if (handlersRef.current) {
            try {
              instanceToCleanup.off('joined-meeting', handlersRef.current.joinedMeeting);
              instanceToCleanup.off('left-meeting', handlersRef.current.leftMeeting);
              instanceToCleanup.off('participant-joined', handlersRef.current.participantJoined);
              instanceToCleanup.off('participant-left', handlersRef.current.participantLeft);
              instanceToCleanup.off('local-audio-level', handlersRef.current.localAudioLevel);
              instanceToCleanup.off('error', handlersRef.current.callError);
            } catch (e) {
              // Ignore listener removal errors
            }
          }
          instanceToCleanup.destroy();
          logger.debug('[useDaily] ✓ Cleanup complete');
        } catch (e) {
          logger.warn('[useDaily] Cleanup error:', e);
        }

        // Always clear refs
        dailyCallRef.current = null;
        globalDailyInstance = null;
        handlersRef.current = null;
        isCleaningUp = false;
      }
    };
    // Empty dependency array - only run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    joinRoom,
    leaveRoom,
    toggleAudio: () => setAudio(!state.isAudioOn),
    setSpeaker,
  };
};
