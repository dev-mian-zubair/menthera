import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useUserProfile } from '@/hooks';
import { Avatar } from '@/components/ui';
import { MentheraLogo } from './menthera-logo';
import { headerStyles } from '@/lib/styles/layout/header.styles';
import { ROUTES } from '@/lib/routes';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showLogo = true
}) => {
  const { displayName, email, avatar } = useUserProfile();

  const handleProfilePress = () => {
    router.push(ROUTES.TABS.PROFILE);
  };

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.content}>
        {/* Logo/Title */}
        {showLogo ? (
          <MentheraLogo size="small" showWordmark={false} />
        ) : (
          <Text style={headerStyles.title}>
            {title || 'Home'}
          </Text>
        )}

        {/* User Avatar */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleProfilePress}
          style={headerStyles.avatarButton}
        >
          {avatar ? (
            <Avatar
              size="sm"
              src={{ uri: avatar }}
              alt={displayName || 'User'}
            />
          ) : (
            <Avatar
              size="sm"
              variant="purple"
              fallback={(displayName || (email ? email.split('@')[0] : 'User')).charAt(0).toUpperCase()}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
