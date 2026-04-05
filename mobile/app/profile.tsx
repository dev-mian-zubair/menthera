import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useClerk } from '@/hooks';
import { Avatar } from '@/components/ui';
import { UsageCard } from '@/components/cards/usage-card';
import { profileStyles } from '@/lib/styles/screens/tabs/profile.styles';
import { useUser } from '@clerk/clerk-expo';
import { SubscriptionManager } from '@/components/screens/profile/SubscriptionManager';
import { ApiKeyManager } from '@/components/screens/profile/ApiKeyManager';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { userApi } from '@/lib/api/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
] as const;

const LANGUAGE_STORAGE_KEY = 'menthera_preferred_language';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const insets = useSafeAreaInsets();
  const theme = useMemo(() => getTimeTheme(), []);
  const [signingOut, setSigningOut] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [updatingLanguage, setUpdatingLanguage] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((stored) => {
      if (stored) setSelectedLanguage(stored);
    });
  }, []);

  const displayName = user?.fullName || '';
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const avatar = user?.imageUrl || '';

  const handleClose = () => {
    router.back();
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently remove all your data, conversations, and purchased credits.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This will immediately and permanently delete your account.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLanguageChange = async (code: string) => {
    if (code === selectedLanguage) return;
    setUpdatingLanguage(true);
    const response = await userApi.updateLanguage(code);
    if (response.success) {
      setSelectedLanguage(code);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      setShowLanguageOptions(false);
    } else {
      Alert.alert('Error', 'Failed to update language. Please try again.');
    }
    setUpdatingLanguage(false);
  };

  const currentLanguageLabel = LANGUAGE_OPTIONS.find((l) => l.code === selectedLanguage)?.label || 'English';

  return (
    <View style={[profileStyles.safeArea, { backgroundColor: theme.profile.background }]}>
      <StatusBar barStyle={theme.isNightMode ? 'light-content' : 'dark-content'} />

      {/* Header with Close Button */}
      <View style={[
        profileStyles.header.container,
        {
          paddingTop: insets.top + 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }
      ]}>
        <Text style={[profileStyles.header.title, { color: theme.profile.headerTitle }]}>Profile</Text>
        <TouchableOpacity
          onPress={handleClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.glass.cardBackground,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color={theme.textColor} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={profileStyles.scrollContent}
      >
        {/* User Info Card */}
        <View style={[profileStyles.userCard.container, { backgroundColor: theme.profile.userCardBackground }]}>
          {/* User Avatar */}
          <View style={profileStyles.userCard.avatarContainer}>
            {avatar ? (
              <Avatar
                size="xl"
                src={{ uri: avatar }}
                alt={displayName || 'User'}
              />
            ) : (
              <Avatar
                size="xl"
                variant="purple"
                fallback={(displayName || (email ? email.split('@')[0] : 'User')).charAt(0).toUpperCase()}
              />
            )}
          </View>

          {/* User Details */}
          <Text style={[profileStyles.userCard.name, { color: theme.profile.userName }]}>
            {displayName || (email ? email.split('@')[0] : 'User')}
          </Text>
          <Text style={[profileStyles.userCard.email, { color: theme.profile.userEmail }]}>
            {email || 'No email'}
          </Text>
        </View>

        {/* Language Selection */}
        <View style={profileStyles.section.container}>
          <TouchableOpacity
            onPress={() => setShowLanguageOptions(!showLanguageOptions)}
            activeOpacity={0.7}
            style={[
              profileStyles.menuItem.container,
              {
                backgroundColor: theme.profile.menuItemBackground,
                marginBottom: showLanguageOptions ? 12 : 0,
              },
            ]}
          >
            <View style={[profileStyles.menuItem.iconContainer, { backgroundColor: theme.profile.menuItemIconBackground }]}>
              <Ionicons name="globe-outline" size={20} color={theme.profile.menuItemIconColor} />
            </View>
            <View style={profileStyles.menuItem.content}>
              <Text style={[profileStyles.menuItem.title, { color: theme.profile.menuItemTitle }]}>Language</Text>
              <Text style={[profileStyles.menuItem.subtitle, { color: theme.profile.menuItemSubtitle }]}>{currentLanguageLabel}</Text>
            </View>
            {updatingLanguage ? (
              <ActivityIndicator size="small" color={theme.profile.chevronColor} />
            ) : (
              <Ionicons
                name={showLanguageOptions ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.profile.chevronColor}
              />
            )}
          </TouchableOpacity>

          {showLanguageOptions && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LANGUAGE_OPTIONS.map((lang) => {
                const isSelected = lang.code === selectedLanguage;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => handleLanguageChange(lang.code)}
                    disabled={updatingLanguage}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: isSelected ? theme.profile.menuItemIconBackground : theme.profile.menuItemBackground,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? theme.profile.menuItemIconColor : theme.profile.menuItemSubtitle + '40',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: isSelected ? 'SFProDisplaySemibold' : 'SFProDisplayRegular',
                        color: isSelected ? theme.profile.menuItemIconColor : theme.profile.menuItemTitle,
                      }}
                    >
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Usage Stats Card */}
        <UsageCard />

        {/* Billing & Subscription Management */}
        <SubscriptionManager />

        {/* API Key Management */}
        <ApiKeyManager />

        {/* Advanced Settings */}
        <View style={profileStyles.section.container}>
          <TouchableOpacity
            onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
            activeOpacity={0.7}
            style={[
              profileStyles.menuItem.container,
              {
                backgroundColor: theme.profile.menuItemBackground,
                marginBottom: showAdvancedSettings ? 12 : 0
              }
            ]}
          >
            <View style={[profileStyles.menuItem.iconContainer, { backgroundColor: theme.profile.menuItemIconBackground }]}>
              <Ionicons name="settings-outline" size={20} color={theme.profile.menuItemIconColor} />
            </View>
            <View style={profileStyles.menuItem.content}>
              <Text style={[profileStyles.menuItem.title, { color: theme.profile.menuItemTitle }]}>Advanced Settings</Text>
              <Text style={[profileStyles.menuItem.subtitle, { color: theme.profile.menuItemSubtitle }]}>Account management options</Text>
            </View>
            <Ionicons
              name={showAdvancedSettings ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.profile.chevronColor}
            />
          </TouchableOpacity>

          {/* Expandable Advanced Settings Content */}
          {showAdvancedSettings && (
            <View style={[profileStyles.dangerZone.container, { backgroundColor: theme.profile.dangerZoneBackground }]}>
              <Text style={[profileStyles.dangerZone.warning, { color: theme.profile.dangerZoneWarning }]}>
                These actions are permanent and cannot be undone. Please proceed with caution.
              </Text>

              {/* Delete Account Button */}
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
                activeOpacity={0.7}
                style={[profileStyles.dangerZone.deleteButton, { backgroundColor: theme.profile.dangerZoneButtonBackground }]}
              >
                {deletingAccount ? (
                  <ActivityIndicator size="small" color="#DC2626" style={{ marginRight: 12 }} />
                ) : (
                  <Ionicons name="trash-outline" size={20} color="#DC2626" style={{ marginRight: 12 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={profileStyles.dangerZone.deleteTitle}>
                    {deletingAccount ? 'Deleting Account...' : 'Delete Account'}
                  </Text>
                  <Text style={profileStyles.dangerZone.deleteSubtitle}>
                    Permanently remove all data and conversations
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.7}
          style={[profileStyles.signOutButton.container, { backgroundColor: theme.profile.signOutBackground }]}
        >
          {signingOut ? (
            <ActivityIndicator size="small" color={theme.profile.signOutIcon} style={{ marginRight: 12 }} />
          ) : (
            <Ionicons name="log-out-outline" size={20} color={theme.profile.signOutIcon} style={{ marginRight: 12 }} />
          )}
          <Text style={[profileStyles.signOutButton.text, { color: theme.profile.signOutText }]}>
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
