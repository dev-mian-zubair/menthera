import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/auth';
import { useClerkToken } from '@/hooks/apis';
import { ROUTES } from '@/lib/routes';
import { tokens } from '@/lib/styles/core/tokens';
import { getRandomQuote } from '@/lib/constants/quotes';
import { logger } from '@/lib/utils/logger';
import { API_CONFIG } from '@/lib/api/config';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Animation timing constants (in milliseconds)
const ANIMATION_TIMINGS = {
  FADE_IN: 600,        // Duration for quote to fade in
  DISPLAY: 2500,       // Duration to display quote - quick read
  FADE_OUT: 1000,      // Duration to fade out - smooth transition
  BG_COLOR_TRANSITION: 1000, // Duration for background color blend - matches fade-out
  TOTAL_DISPLAY: 3100, // Total time before fade out (~3.1 seconds total)
} as const;

// Note: These were module-level variables. Now moved inside component as useRef
// to avoid stale state across HMR and auth session changes.

// Loading screen component with motivational quote
interface InitializationLoadingScreenProps {
  onAnimationComplete?: () => void;
  shouldFadeOut?: boolean;  // Trigger fade-out from parent
  quote: { text: string; author: string };
}

// Module-level debug counter for loading screen mount tracking
const screenMountCountRef = { current: 0 };

// Debug logging for module-level variables
const debugLog = (msg: string, data?: any) => {
  logger.debug(`[AuthGuard Module] ${msg}`, data ? JSON.stringify(data) : '');
};

const InitializationLoadingScreen: React.FC<InitializationLoadingScreenProps> = ({ onAnimationComplete, shouldFadeOut = false, quote }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Track if this is a new mount
  const isMountRef = useRef(true);
  if (isMountRef.current) {
    screenMountCountRef.current++;
    isMountRef.current = false;
    logger.debug(`[InitializationLoadingScreen] 📺 MOUNT #${screenMountCountRef.current} - Quote: "${quote.text.substring(0, 40)}..."`);
  }

  useEffect(() => {
    logger.debug(`[InitializationLoadingScreen] 🎬 MOUNT #${screenMountCountRef.current} EFFECT - Starting fade-in animation`);
    // Fade in and scale up when component mounts (0-600ms)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_TIMINGS.FADE_IN,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: ANIMATION_TIMINGS.FADE_IN,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      // Cleanup if component unmounts unexpectedly
      logger.debug(`[InitializationLoadingScreen] 🎬 MOUNT #${screenMountCountRef.current} - Component unmounting`);
    };
  }, [fadeAnim, scaleAnim]);

  // PARENT-CONTROLLED FADE OUT: Triggered by shouldFadeOut prop
  useEffect(() => {
    if (shouldFadeOut) {
      logger.debug(`[InitializationLoadingScreen] 🎬 MOUNT #${screenMountCountRef.current} EFFECT - Starting fade-out animation (parent triggered)`);

      // Fade out and scale down - smooth fade transition
      // Keep background blue during fade for seamless transition with parent background
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_TIMINGS.FADE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: ANIMATION_TIMINGS.FADE_OUT,
          useNativeDriver: true,
        }),
      ]).start(() => {
        logger.debug(`[InitializationLoadingScreen] 🎬 MOUNT #${screenMountCountRef.current} - Fade-out animation complete`);
        onAnimationComplete?.();
      });
    }
  }, [shouldFadeOut, fadeAnim, scaleAnim, onAnimationComplete]);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.colors.brand.serenityBlue }}>
      {/* Keep background blue while content fades */}
      <Animated.View style={{ flex: 1, backgroundColor: tokens.colors.brand.serenityBlue }}>
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontFamily: 'SFProDisplayBold',
              color: tokens.colors.text.inverse,
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 38,
              letterSpacing: -0.5,
            }}
          >
            {quote.text}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'SFProDisplayRegular',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              letterSpacing: -0.2,
            }}
          >
            — {quote.author}
          </Text>
        </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// Memoize the loading screen component to prevent remounts when parent remounts
const MemoizedInitializationLoadingScreen = React.memo(InitializationLoadingScreen);

// Cache the JSX element at module level so it's the SAME object across renders
let cachedLoadingScreenElement: React.ReactElement | null = null;

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [hasRoutingCompleted, setHasRoutingCompleted] = useState(false);
  const [isInitializationComplete, setIsInitializationComplete] = useState(false);
  const [shouldFadeOutLoading, setShouldFadeOutLoading] = useState(false);
  const [sessionInitStarted, setSessionInitStarted] = useState(false);
  const routingExecutedRef = useRef(false);
  const renderCountRef = useRef(0);
  const initCompletedRef = useRef(false);

  // Session tracking refs (previously module-level variables)
  const sessionInitializationStartedRef = useRef(false);
  const hasResetForThisSessionRef = useRef(false);
  const hasEverBeenSignedInRef = useRef(false);
  const sessionQuoteRef = useRef(getRandomQuote());
  const isFirstRenderRef = useRef(true);

  // Convenience aliases for cleaner access
  const sessionInitializationStarted = sessionInitializationStartedRef.current;
  const hasResetForThisSession = hasResetForThisSessionRef.current;
  const hasEverBeenSignedIn = hasEverBeenSignedInRef.current;
  const sessionQuote = sessionQuoteRef.current;
  const isFirstRender = isFirstRenderRef.current;

  // Log every render with comprehensive state tracking
  renderCountRef.current++;

  // CRITICAL: Log module-level state that persists across renders
  if (renderCountRef.current <= 50) {
    logger.debug(
      `[R${renderCountRef.current}] MODULE: sessionInit=${sessionInitializationStarted} | isFirstRender=${isFirstRender} | hasEverBeenSignedIn=${hasEverBeenSignedIn} | initCompletedRef=${initCompletedRef.current}`
    );
    logger.debug(
      `[R${renderCountRef.current}] STATE: isInit=${isInitializationComplete} | shouldFadeOut=${shouldFadeOutLoading} | hasRoute=${hasRoutingCompleted}`
    );
    logger.debug(
      `[R${renderCountRef.current}] AUTH: signed=${isSignedIn} | loaded=${isLoaded}`
    );
  }

  debugLog(`🔄 RENDER #${renderCountRef.current} START`, {
    sessionInitializationStarted,
    isInitializationComplete,
    hasRoutingCompleted,
    isSignedIn,
    isLoaded,
    shouldShowLoadingScreen: !isInitializationComplete,
  });

  // Set up Clerk token getter for API client
  // This ensures all authenticated API requests include the Bearer token
  useClerkToken();

  // Cleanup pending call ends from previous session
  // If the app crashed during a call, we stored the callId in AsyncStorage
  // This ensures the backend is notified on next app launch
  const pendingCallCleanupRef = useRef(false);
  useEffect(() => {
    const cleanupPendingCalls = async () => {
      // Only run once per session and only when auth is loaded and user is signed in
      if (pendingCallCleanupRef.current || !isLoaded || !isSignedIn) return;
      pendingCallCleanupRef.current = true;

      try {
        const pendingCallId = await AsyncStorage.getItem('pendingCallEnd');
        if (pendingCallId) {
          logger.debug('[AuthGuard] 🧹 Found pending call end, cleaning up:', pendingCallId);
          const token = await getToken();
          if (token) {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL || API_CONFIG.BASE_URL}/call/${pendingCallId}/user-left`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (response.ok) {
              logger.debug('[AuthGuard] ✓ Pending call end cleaned up successfully');
            } else {
              logger.warn('[AuthGuard] Pending call cleanup returned status:', response.status);
            }
          }
          // Remove from storage regardless of success (avoid infinite retry loops)
          await AsyncStorage.removeItem('pendingCallEnd');
        }
      } catch (error) {
        logger.warn('[AuthGuard] Error cleaning up pending call:', error);
        // Still try to remove from storage to prevent retry loops
        try {
          await AsyncStorage.removeItem('pendingCallEnd');
        } catch (e) {
          // Silently ignore
        }
      }
    };

    cleanupPendingCalls();
  }, [isLoaded, isSignedIn, getToken]);

  const pathname = usePathname();

  // Auto-hide loading screen after animation completes
  // Only start timer ONCE per session when loading screen starts
  const timerStartedRef = useRef(false);

  useEffect(() => {
    if (sessionInitStarted && !timerStartedRef.current) {
      timerStartedRef.current = true;
      logger.debug(`[AuthGuard] ⏱️ STARTING AUTO-HIDE TIMER (${ANIMATION_TIMINGS.TOTAL_DISPLAY}ms) - timer effect triggered by module-level state change`);
      debugLog(`⏱️ Starting auto-hide timer for loading screen (${ANIMATION_TIMINGS.TOTAL_DISPLAY}ms)`);

      // Timeline:
      // 0-800ms: Quote fades in
      // 800-5300ms: Quote displays (4500ms for reading)
      // 5300-6800ms: Quote fades out while background transitions from serenityBlue → creamBeige
      // 6800ms: Welcome/Home screen appears (already creamBeige for seamless blend)
      // TOTAL: 8800ms (7300ms display + 1500ms fade-out)
      const totalAnimationTime = ANIMATION_TIMINGS.TOTAL_DISPLAY + ANIMATION_TIMINGS.FADE_OUT;

      const timer = setTimeout(() => {
        logger.debug(`[AuthGuard] ⏱️ TIMER FIRED AT ${ANIMATION_TIMINGS.TOTAL_DISPLAY}ms - Triggering loading screen fade-out with color transition`);
        // Trigger the loading screen to fade out while blending background color
        setShouldFadeOutLoading(true);
      }, ANIMATION_TIMINGS.TOTAL_DISPLAY);

      // Complete initialization after full animation (display + fade-out)
      const completionTimer = setTimeout(() => {
        if (!initCompletedRef.current) {
          initCompletedRef.current = true;
          logger.debug(`[AuthGuard] ⏱️ FULL ANIMATION COMPLETE (${totalAnimationTime}ms) - Marking initialization complete`);
          setIsInitializationComplete(true);
        }
      }, totalAnimationTime);

      return () => {
        clearTimeout(timer);
        clearTimeout(completionTimer);
      };
    }

    // Reset timer when initialization is reset (sign-out case)
    if (!sessionInitStarted && timerStartedRef.current) {
      timerStartedRef.current = false;
      setShouldFadeOutLoading(false);
      logger.debug('[AuthGuard] ⏱️ RESETTING TIMER REF (due to sign-out/reset)');
    }
  }, [sessionInitStarted]);

  // Reset routing when auth state changes fundamentally
  useEffect(() => {
    // Track if user has ever been signed in (for detecting actual sign-out vs initial load)
    if (isSignedIn === true) {
      hasEverBeenSignedInRef.current = true;
      hasResetForThisSessionRef.current = false;
      routingExecutedRef.current = false;
      logger.debug('[AuthGuard] User signed in - resetting routing for signed-in flow');
      debugLog('SIGN-IN: User is signed in - resetting routing to handle signed-in state');
    }

    // Only reset initialization on ACTUAL sign-out (user WAS signed in, NOW signed out)
    if (isSignedIn === false && isLoaded && hasEverBeenSignedInRef.current && !hasResetForThisSessionRef.current) {
      logger.debug('[AuthGuard] ACTUAL SIGN-OUT detected - resetting initialization');
      hasResetForThisSessionRef.current = true;
      sessionInitializationStartedRef.current = false;
      setSessionInitStarted(false);
      sessionQuoteRef.current = getRandomQuote();
      cachedLoadingScreenElement = null;
      isFirstRenderRef.current = true;
      // Reset routing ref and timer ref for next session
      routingExecutedRef.current = false;
      setIsInitializationComplete(false);
      debugLog('🔄 ACTUAL SIGN-OUT: Reset initialization flags for next session');
    }

    logger.debug('[AuthGuard] Auth state changed', { isSignedIn, isLoaded, hasEverBeenSignedIn: hasEverBeenSignedInRef.current });
  }, [isSignedIn, isLoaded]);

  // Handle navigation based on auth state
  // IMPORTANT: This effect should only run when auth state changes, NOT when pathname changes
  // Using pathname in dependency array causes redirect loops
  useEffect(() => {
    logger.debug('[AuthGuard] 🔀 ROUTING EFFECT RUNNING', { isLoaded, isSignedIn, routingExecuted: routingExecutedRef.current, isInitComplete: isInitializationComplete });

    // Only handle navigation once auth is loaded
    if (!isLoaded) {
      logger.debug('[AuthGuard] ⏳ Still loading auth');
      return;
    }

    // CRITICAL: For unsigned users showing loading screen, wait for initialization animation to complete
    // This ensures the full 7.3 second quote display + fade-out animation plays before routing
    if (!isSignedIn && sessionInitializationStarted && !isInitializationComplete) {
      logger.debug('[AuthGuard] ⏳ Unsigned user showing loading screen animation - waiting for initialization to complete before routing');
      return;
    }

    logger.debug('[AuthGuard] ✅ ROUTING EFFECT CONDITIONS MET - proceeding with navigation logic');

    // Only process routing once (marked by ref)
    if (routingExecutedRef.current) {
      logger.debug('[AuthGuard] ✓ Routing already executed, skipping re-evaluation');
      return;
    }

    // Check if user is trying to access auth routes
    const isOnAuthRoute = pathname.startsWith('/auth');
    const isOnMainApp = pathname.startsWith('/(tabs)') || pathname === '/';

    logger.debug('[AuthGuard] 🔍 Initial navigation check:', {
      isSignedIn,
      isOnAuthRoute,
      isOnMainApp,
      pathname,
    });

    let shouldNavigate = false;
    let targetRoute: string | null = null;

    if (isSignedIn) {
      // User is signed in
      if (isOnAuthRoute) {
        // Signed in but on auth page - redirect to home
        targetRoute = ROUTES.TABS.HOME;
        logger.debug('[AuthGuard] 🔀 Signed in on auth route, redirecting to home');
        shouldNavigate = true;
      } else {
        // Signed in and on app routes - this is correct
        logger.debug('[AuthGuard] ✓ User on app routes (signed in, this is correct)');
        routingExecutedRef.current = true;
        setHasRoutingCompleted(true);
      }
    } else if (!isSignedIn) {
      // User is not signed in - should be on auth routes
      if (isOnAuthRoute) {
        // On auth routes while unsigned in - this is correct
        logger.debug('[AuthGuard] ✓ User on auth route (not signed in, this is correct)');
        routingExecutedRef.current = true;
        setHasRoutingCompleted(true);
      } else {
        // Not signed in and not on auth route - redirect to welcome
        targetRoute = ROUTES.AUTH.WELCOME;
        logger.debug('[AuthGuard] 🔀 Not signed in and not on auth route, redirecting to welcome');
        shouldNavigate = true;
      }
    }

    // Execute navigation if needed
    if (shouldNavigate && targetRoute) {
      logger.debug('[AuthGuard] → Executing router.replace to', targetRoute);
      router.replace(targetRoute as any);
      // Mark as executed immediately to prevent re-evaluation
      routingExecutedRef.current = true;
      setHasRoutingCompleted(true);
    }
  }, [isLoaded, isSignedIn, isInitializationComplete]);

  // CRITICAL: Only show loading screen for:
  // 1. Signed-in users (motivational quotes)
  // 2. While auth is still loading (!isLoaded) - show loading screen during auth check
  // 3. For unsigned users transitioning from main app (shows fade-out animation to welcome screen)
  //
  // This prevents the double-screen UX issue while maintaining smooth transition animations.
  const isOnMainApp = pathname.startsWith('/(tabs)') || pathname === '/';
  const shouldShowLoadingScreenForUnsignedInTransition = !isSignedIn && isLoaded && isOnMainApp && !isInitializationComplete;
  const shouldShowLoadingScreen = !isInitializationComplete && (isSignedIn || !isLoaded || shouldShowLoadingScreenForUnsignedInTransition);

  if (renderCountRef.current <= 50) {
    logger.debug(`[R${renderCountRef.current}] DECISION: shouldShow=${shouldShowLoadingScreen} (init=${!isInitializationComplete}, signed=${isSignedIn}, loaded=${isLoaded}, onMainApp=${isOnMainApp})`);
  }

  if (shouldShowLoadingScreen) {
    // Show loading screen (quotes) for:
    // 1. Signed-in users (motivational before app use)
    // 2. While auth is loading (during first render before we know if user is signed in)
    // 3. Unsigned users during route transition (shows fade-out to welcome screen)

    // CRITICAL: Handle both first render AND app reload for authenticated users
    // On reload, isFirstRender is false but sessionInitializationStarted is also false
    // We need to start initialization when we should show loading screen but haven't started yet
    if (isFirstRenderRef.current || (!sessionInitializationStartedRef.current && shouldShowLoadingScreen)) {
      if (isFirstRenderRef.current) {
        isFirstRenderRef.current = false;
      }
      sessionInitializationStartedRef.current = true;
      setSessionInitStarted(true);
      logger.debug(`[R${renderCountRef.current}] 🎬 INITIALIZING - sessionInit=true (first render or reload)`);
      debugLog('🎬 INITIALIZING: Starting initialization (first render or reload)');

      // For unsigned users who just loaded, trigger fade-out immediately
      if (!isSignedIn && isLoaded && isOnMainApp) {
        logger.debug(`[R${renderCountRef.current}] 🎬 UNSIGNED USER TRANSITION - Will fade out immediately`);
        // Trigger fade-out on next render cycle
        setTimeout(() => {
          setShouldFadeOutLoading(true);
        }, 0);
      }
    }

    // Only render loading screen if initialization started
    if (sessionInitializationStartedRef.current) {
      logger.debug(
        `[R${renderCountRef.current}] 📺 SHOWING LOADING SCREEN (shouldFadeOut=${shouldFadeOutLoading}, isUnsigned=${!isSignedIn})`
      );
      // Return loading screen with current shouldFadeOut prop
      // Using Memoized component to prevent unnecessary remounts due to prop changes
      return <MemoizedInitializationLoadingScreen quote={sessionQuote} shouldFadeOut={shouldFadeOutLoading} />;
    }
  }

  // Mark initialization as complete for unsigned users who've transitioned away from main app
  // (Signed-in users are handled by the timer in the useEffect above)
  if (!isInitializationComplete && !isSignedIn && !isOnMainApp) {
    logger.debug(`[R${renderCountRef.current}] ⏭️  Marking initialization complete (unsigned user routed away from main app)`);
    setIsInitializationComplete(true);
  }

  // CRITICAL: For unsigned users, don't render children if they're still on main app route
  // This prevents rendering the tab layout before routing to /auth/welcome completes
  // Even after animation and routing, the pathname might still be /(tabs) briefly during transition
  if (!isSignedIn && isOnMainApp) {
    logger.debug(
      `[R${renderCountRef.current}] ⏳ BLOCKING MAIN APP RENDER - Unsigned user still on main app route (pathname=${pathname}), waiting for route transition`
    );
    // Return a null/empty view while we're on the main app route
    return <View style={{ flex: 1 }} />;
  }

  // Initialization complete - show actual content
  debugLog(`📱 SHOWING CONTENT`, {
    sessionInitializationStarted,
    isInitializationComplete,
    isSignedIn,
    renderCount: renderCountRef.current,
  });
  logger.debug(
    `[AuthGuard] 📱 RENDER #${renderCountRef.current}: SHOWING CONTENT (isSignedIn=${isSignedIn})`
  );

  // IMPORTANT: Don't wrap with providers here - they're already in _layout.tsx
  // Wrapping here causes duplicate providers which leads to infinite loops
  debugLog(`📱 Returning: children (providers handled by _layout)`);
  return <>{children}</>;
};
