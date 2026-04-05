/**
 * OAuth Button Component
 * Reusable button for Google and Apple authentication
 * Features 3D shadow effect similar to agent cards
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { tokens } from '@/lib/styles/core/tokens';
import { AppleLogo } from '@/components/Assets/AppleLogo';
import { GoogleLogo } from '@/components/Assets/GoogleLogo';

export type OAuthProvider = 'apple' | 'google';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onPress,
  isLoading = false,
  disabled = false,
}) => {
  const isApple = provider === 'apple';
  const isGoogle = provider === 'google';

  const borderColor = isApple ? '#000000' : '#D0D0D0';

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
    backgroundColor: isApple ? '#000000' : '#FFFFFF',
    ...(disabled && { opacity: 0.6 }),
  };

  const textStyle: TextStyle = {
    fontSize: 16,
    fontWeight: '600',
    color: isApple ? '#FFFFFF' : '#1F2937',
    marginLeft: 12,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      style={containerStyle}
    >
      {isLoading ? (
        <ActivityIndicator color={isApple ? '#FFFFFF' : '#1F2937'} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isApple && <AppleLogo width={20} height={20} />}
          {isGoogle && <GoogleLogo width={20} height={20} />}
          <Text style={textStyle}>
            {isApple ? 'Sign in with Apple' : 'Sign in with Google'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default OAuthButton;
