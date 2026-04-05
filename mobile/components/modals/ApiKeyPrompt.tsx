import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userApi } from '@/lib/api/user';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { logger } from '@/lib/utils/logger';

interface ApiKeyPromptProps {
  visible: boolean;
  onSuccess: () => void;
  onDismiss: () => void;
}

export const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ visible, onSuccess, onDismiss }) => {
  const theme = useMemo(() => getTimeTheme(), []);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('Please enter your API key');
      return;
    }
    if (!trimmed.startsWith('AIza') || trimmed.length < 30) {
      setError('Invalid key format. Gemini API keys start with "AIza" and are at least 30 characters.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await userApi.storeApiKey(trimmed);
      if (response.success && response.data?.stored) {
        logger.debug('[ApiKeyPrompt] API key saved successfully');
        setApiKey('');
        setError(null);
        onSuccess();
      } else if (!response.success) {
        setError(response.error || 'Failed to save API key');
      } else {
        setError('Failed to save API key');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = () => {
    setApiKey('');
    setError(null);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleDismiss}
        />

        <View
          style={{
            backgroundColor: theme.modal?.background || '#FBF7F4',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
          }}
        >
          {/* Handle Bar */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: theme.modal?.handleBar || '#E0E0E0',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              marginBottom: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'SFProDisplayBold',
                  color: theme.modal?.headerTitle || '#1A1A1A',
                }}
              >
                Add your API key
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'SFProDisplayRegular',
                  color: theme.modal?.headerSubtitle || '#666',
                  marginTop: 4,
                }}
              >
                A Google Gemini API key is needed to chat, call, and start quests.
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: theme.modal?.closeButtonBackground || 'rgba(0,0,0,0.06)',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 12,
              }}
            >
              <Ionicons name="close" size={20} color={theme.modal?.closeButtonIcon || '#2C2C2C'} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            {/* AI Studio link */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}
              onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}
              activeOpacity={0.7}
            >
              <Ionicons name="open-outline" size={14} color="#5A86FF" />
              <Text style={{ fontSize: 13, fontFamily: 'SFProDisplayMedium', color: '#5A86FF' }}>
                Get a free key from Google AI Studio
              </Text>
            </TouchableOpacity>

            {/* Input row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <TextInput
                value={apiKey}
                onChangeText={(text) => { setApiKey(text); setError(null); }}
                placeholder="AIza..."
                placeholderTextColor="rgba(0,0,0,0.3)"
                secureTextEntry={!showKey}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  fontFamily: 'SFProDisplayRegular',
                  color: theme.modal?.headerTitle || '#1A1A1A',
                }}
              />
              <TouchableOpacity
                onPress={() => setShowKey(!showKey)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={showKey ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Error */}
            {error && (
              <Text style={{ fontSize: 13, fontFamily: 'SFProDisplayRegular', color: '#DC2626', marginBottom: 12 }}>
                {error}
              </Text>
            )}

            {/* Save button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !apiKey.trim()}
              style={{
                backgroundColor: '#000',
                borderRadius: 100,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: saving || !apiKey.trim() ? 0.5 : 1,
                marginBottom: 10,
              }}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={{ fontSize: 16, fontFamily: 'SFProDisplaySemibold', color: '#FFF' }}>
                  Save & Continue
                </Text>
              )}
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={handleDismiss}
              style={{ paddingVertical: 10, alignItems: 'center' }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, fontFamily: 'SFProDisplayMedium', color: theme.modal?.headerSubtitle || '#666' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
