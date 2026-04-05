/**
 * ApiKeyManager Component
 *
 * Allows BYOK users to manage their Google Gemini API key.
 * - Input and validate a new key
 * - View masked key info
 * - Remove stored key
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userApi, ApiKeyInfo } from '@/lib/api/user';
import { getTimeTheme } from '@/lib/utils/time-theme';

export const ApiKeyManager: React.FC = () => {
  const theme = useMemo(() => getTimeTheme(), []);
  const [keyInfo, setKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKeyInfo();
  }, []);

  const fetchKeyInfo = async () => {
    setLoading(true);
    const response = await userApi.getApiKeyInfo();
    if (response.success && response.data) {
      setKeyInfo(response.data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
      setError('Invalid key format. Gemini API keys start with "AIza" and are at least 30 characters.');
      return;
    }

    setSaving(true);
    setError(null);

    const response = await userApi.storeApiKey(apiKey.trim());

    if (response.success && response.data?.stored) {
      setApiKey('');
      await fetchKeyInfo();
      Alert.alert('Success', 'Your API key has been validated and saved.');
    } else if (!response.success) {
      setError(response.error || 'Failed to save API key');
    } else {
      setError('Failed to save API key');
    }

    setSaving(false);
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove API Key?',
      'You can add it again anytime. Without a key, BYOK features will not work.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoving(true);
            const response = await userApi.removeApiKey();
            if (response.success) {
              setKeyInfo({ hasKey: false });
            } else {
              Alert.alert('Error', response.error || 'Failed to remove API key');
            }
            setRemoving(false);
          },
        },
      ]
    );
  };

  const handleOpenAiStudio = () => {
    Linking.openURL('https://aistudio.google.com/apikey');
  };

  const styles = {
    container: {
      marginBottom: 16,
    } as ViewStyle,
    header: {
      fontSize: 17,
      fontFamily: 'SFProDisplaySemibold',
      color: theme.profile.sectionTitle,
      marginBottom: 16,
      letterSpacing: -0.2,
    } as TextStyle,
    card: {
      backgroundColor: theme.profile.userCardBackground,
      borderRadius: 28,
      padding: 20,
      marginBottom: 16,
    } as ViewStyle,
    label: {
      fontSize: 13,
      fontFamily: 'SFProDisplayMedium',
      color: theme.profile.menuItemSubtitle,
      marginBottom: 8,
    } as TextStyle,
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    } as ViewStyle,
    input: {
      flex: 1,
      backgroundColor: theme.profile.menuItemBackground,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      fontFamily: 'SFProDisplayRegular',
      color: theme.profile.menuItemTitle,
    } as TextStyle,
    toggleButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.profile.menuItemBackground,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      backgroundColor: theme.quickAction.primaryBackground,
      borderRadius: 28,
      marginBottom: 12,
    } as ViewStyle,
    saveButtonText: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: '#FFFFFF',
      letterSpacing: -0.2,
      marginLeft: 8,
    } as TextStyle,
    storedKeyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    } as ViewStyle,
    storedKeyText: {
      fontSize: 15,
      fontFamily: 'SFProDisplayMedium',
      color: theme.profile.userName,
      letterSpacing: 0.5,
    } as TextStyle,
    validatedAt: {
      fontSize: 12,
      fontFamily: 'SFProDisplayRegular',
      color: theme.profile.menuItemSubtitle,
      marginBottom: 12,
    } as TextStyle,
    removeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      backgroundColor: theme.profile.menuItemBackground,
      borderRadius: 28,
    } as ViewStyle,
    removeButtonText: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: '#DC2626',
      letterSpacing: -0.2,
      marginLeft: 8,
    } as TextStyle,
    errorText: {
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: '#DC2626',
      marginBottom: 12,
    } as TextStyle,
    linkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    } as ViewStyle,
    linkText: {
      fontSize: 13,
      fontFamily: 'SFProDisplayMedium',
      color: theme.quickAction.primaryBackground,
    } as TextStyle,
    infoText: {
      fontSize: 12,
      fontFamily: 'SFProDisplayRegular',
      color: theme.profile.menuItemSubtitle,
      lineHeight: 16,
    } as TextStyle,
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>API Key</Text>
        <View style={styles.card}>
          <ActivityIndicator size="small" color={theme.profile.menuItemSubtitle} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>API Key</Text>

      <View style={styles.card}>
        {keyInfo?.hasKey ? (
          /* Key already stored - show masked info */
          <>
            <Text style={styles.label}>Stored Key</Text>
            <View style={styles.storedKeyRow}>
              <Text style={styles.storedKeyText}>
                {keyInfo.keyPrefix}...{keyInfo.keySuffix}
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            </View>
            {keyInfo.validatedAt && (
              <Text style={styles.validatedAt}>
                Validated {new Date(keyInfo.validatedAt).toLocaleDateString()}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.removeButton, removing && { opacity: 0.5 }]}
              onPress={handleRemove}
              disabled={removing}
              activeOpacity={0.8}
            >
              {removing ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  <Text style={styles.removeButtonText}>Remove Key</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          /* No key - show input */
          <>
            <Text style={styles.label}>Enter your Google Gemini API key</Text>

            <TouchableOpacity style={styles.linkButton} onPress={handleOpenAiStudio}>
              <Ionicons name="open-outline" size={14} color={theme.quickAction.primaryBackground} />
              <Text style={styles.linkText}>Get a free key from Google AI Studio</Text>
            </TouchableOpacity>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={(text) => { setApiKey(text); setError(null); }}
                placeholder="AIza..."
                placeholderTextColor={theme.profile.menuItemSubtitle}
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowKey(!showKey)}
              >
                <Ionicons
                  name={showKey ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.profile.menuItemSubtitle}
                />
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.saveButton, (saving || !apiKey.trim()) && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving || !apiKey.trim()}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Validate & Save</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.infoText}>
              Your key is stored securely and never shared. It's used only to make AI calls on your behalf.
            </Text>
          </>
        )}
      </View>
    </View>
  );
};
