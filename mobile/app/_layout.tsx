import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo, useState } from 'react';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/clerk-expo';
import { Colors, ThemeProvider } from '@/constants/Theme';
import { AuthGuard } from '@/components/auth';
import { OnboardingGuard } from '@/components/onboarding';
import { ErrorBoundary } from '@/components/ui';
import { AgentsProvider, AgentPreferencesProvider } from '@/providers';
import { ChatProvider } from '@/providers/ChatProvider';
import { QuestProvider } from '@/providers/QuestProvider';
import { RevenueCatProvider } from '@/providers/RevenueCatProvider';
import { UsageProvider } from '@/providers/UsageProvider';
import { EngagementProvider } from '@/providers/EngagementProvider';
import { tokenCache } from '@/lib/clerk';
import { useFonts } from '@/hooks';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { logger } from '@/lib/utils/logger';

import '../global.css';

export {
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
      card: 'transparent',
    },
  };

  return (
    <NavigationThemeProvider value={customLightTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="agent/[id]" />
        <Stack.Screen
          name="call/[agentId]"
          options={{
            presentation: 'fullScreenModal',
          }}
        />
        {/* Welcome/Auth */}
        <Stack.Screen
          name="auth/welcome"
          options={{
            headerShown: false,
            contentStyle: {
              backgroundColor: Colors.light.primary,
            },
           }}
        />
        {/* Onboarding */}
        <Stack.Screen
          name="onboarding/index"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        {/* Agent Quest */}
        <Stack.Screen
          name="quest/[agentId]"
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        {/* Achievements */}
        <Stack.Screen
          name="achievements"
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        {/* Profile Modal */}
        <Stack.Screen
          name="profile"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Missing Clerk publishable key. Please add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file');
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const { fontsLoaded, fontError } = useFonts();
  const theme = useMemo(() => getTimeTheme(), []);

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts to load
        if (fontsLoaded || fontError) {
          // Small delay to ensure everything is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          setAppIsReady(true);
        }
      } catch (e) {
        logger.warn('App initialization error:', e);
        setAppIsReady(true);
      }
    }

    prepare();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Hide splash screen once app is ready
    if (appIsReady) {
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          logger.warn('Error hiding splash screen:', e);
        }
      };
      hideSplash();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={publishableKey}
        tokenCache={tokenCache}
        telemetry={false}
      >
        <RevenueCatProvider>
          <UsageProvider>
            <ThemeProvider>
              <SafeAreaProvider style={{ backgroundColor: theme.gradientColors[0] }}>
                <SystemBars style={theme.isNightMode ? "light" : "dark"} />
                <AuthGuard>
                  <AgentsProvider>
                    <EngagementProvider>
                      <OnboardingGuard>
                        <AgentPreferencesProvider>
                          <QuestProvider>
                            <ChatProvider>
                              <AppContent />
                            </ChatProvider>
                          </QuestProvider>
                        </AgentPreferencesProvider>
                      </OnboardingGuard>
                    </EngagementProvider>
                  </AgentsProvider>
                </AuthGuard>
              </SafeAreaProvider>
            </ThemeProvider>
          </UsageProvider>
        </RevenueCatProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
