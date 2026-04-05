import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { welcomeStyles } from '@/lib/styles/screens/auth/welcome.styles';
import { tokens } from '@/lib/styles/core/tokens';
import { useOAuth } from '@/hooks/auth/useOAuth';
import { useClerkToken } from '@/hooks/apis';
import { useScreenAnimation } from '@/hooks/useScreenAnimation';
import OAuthButton from '@/components/auth/OAuthButton';

export default function WelcomeScreen() {
  // Initialize Clerk token getter even on auth page
  useClerkToken();

  const { handleOAuth, isLoading, loadingProvider, error } = useOAuth();

  // Use unified screen animation hook
  const { animatedStyle } = useScreenAnimation();

  // Logo flying animation
  const logoY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous floating effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoY, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoY, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[welcomeStyles.container, { backgroundColor: tokens.colors.brand.creamBeige }]}>
      <SafeAreaView style={welcomeStyles.safeArea}>
        <ScrollView contentContainerStyle={{ flex: 1 }}>
          <Animated.View
            style={[
              welcomeStyles.content,
              animatedStyle,
            ]}
          >

            {/* Main Content - App Name and Tagline */}
            <View style={welcomeStyles.mainContent}>
              {/* Logo - centered and floating */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Animated.Image
                  source={require('@/assets/images/logo.png')}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 24,
                    transform: [{ translateY: logoY }],
                  }}
                  resizeMode="contain"
                />
              </View>

              {/* Brand name with AI pill - aligned left */}
              <View style={[welcomeStyles.appNameContainer, { marginBottom: 16 }]}>
                <Text style={welcomeStyles.appName}>menthera</Text>
                <View style={welcomeStyles.aiPill}>
                  <Text style={welcomeStyles.aiPillText}>ai</Text>
                </View>
              </View>

              {/* Tagline */}
              <Text style={{
                fontSize: 28,
                fontFamily: 'SFProDisplaySemiBold',
                color: tokens.colors.brand.charcoal,
                letterSpacing: -0.5,
                lineHeight: 36,
              }}>
                Talk. <Text style={{ color: tokens.colors.brand.serenityBlue }}>Heal.</Text> Grow.
              </Text>

              {/* Feature Highlights */}
              <View style={{ gap: 16, marginTop: 32 }}>
                <FeatureItem
                  title="AI Coaches"
                  description="AI wellness coaching for a bright future"
                />
                <FeatureItem
                  title="Always Available"
                  description="Get support whenever you need it"
                />
                <FeatureItem
                  title="Secure & Private"
                  description="Your conversations are encrypted and private"
                />
              </View>
            </View>

            {/* Bottom Buttons */}
            <View style={welcomeStyles.buttons.container}>
              {/* Error Message */}
              {error && (
                <View style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <Text style={{ color: '#7F1D1D', fontSize: 14 }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* OAuth Buttons */}
              <View style={{ gap: 12 }}>
                <OAuthButton
                  provider="apple"
                  onPress={() => handleOAuth('apple')}
                  isLoading={isLoading && loadingProvider === 'apple'}
                  disabled={isLoading}
                />
                <OAuthButton
                  provider="google"
                  onPress={() => handleOAuth('google')}
                  isLoading={isLoading && loadingProvider === 'google'}
                  disabled={isLoading}
                />
              </View>
            </View>

          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

interface FeatureItemProps {
  title: string;
  description: string;
}

function FeatureItem({ title, description }: FeatureItemProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: tokens.colors.brand.serenityBlue,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        <Text style={{ fontSize: 18, color: '#FFFFFF', fontWeight: 'bold' }}>✓</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: 'SFProDisplaySemiBold',
            color: tokens.colors.brand.charcoal,
            marginBottom: 6,
            letterSpacing: -0.3,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontFamily: 'SFProDisplayRegular',
            color: tokens.colors.text.secondary,
            lineHeight: 22,
            letterSpacing: -0.2,
          }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
