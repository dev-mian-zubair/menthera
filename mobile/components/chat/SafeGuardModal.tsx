import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatStyles } from '@/lib/styles/screens/tabs/chat.styles';
import { tokens } from '@/lib/styles/core/tokens';
import { TimeTheme } from '@/lib/utils/time-theme';

interface SafeGuardModalProps {
  isVisible: boolean;
  onClose: () => void;
  theme?: TimeTheme;
}

/**
 * Modal component displaying SafeGuard privacy and security features
 * Shows information about encryption, privacy protection, and data security
 */
export const SafeGuardModal = ({ isVisible, onClose, theme }: SafeGuardModalProps) => {
  const features = [
    {
      icon: 'lock-closed',
      color: '#5A86FF',
      title: 'End-to-End Encryption',
      description: 'All your conversations are encrypted and secure. Only you can access your messages.',
    },
    {
      icon: 'shield-checkmark',
      color: tokens.colors.brand.gentleMint,
      title: 'Privacy First',
      description: 'We never share your data with third parties. Your information stays private.',
    },
    {
      icon: 'eye-off',
      color: '#F59E0B',
      title: 'No Tracking',
      description: 'We don\'t track your activity or sell your data. Your conversations are yours alone.',
    },
    {
      icon: 'server',
      color: '#8B5CF6',
      title: 'Secure Storage',
      description: 'Your data is stored in secure, encrypted servers with industry-standard protection.',
    },
  ];

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={chatStyles.modal.overlay}>
        <TouchableOpacity
          style={chatStyles.modal.touchableOverlay}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            chatStyles.modal.content,
            {
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              backgroundColor: theme?.modal.background,
            }
          ]}
        >
        {/* Handle Bar */}
        <View style={[chatStyles.modal.handleBar, theme && { backgroundColor: theme.modal.handleBar }]} />

        {/* Header */}
        <View style={chatStyles.modal.header}>
          <View style={chatStyles.modal.headerTitleGroup}>
            <Text style={[chatStyles.modal.headerTitle, theme && { color: theme.modal.headerTitle }]}>
              Your Safety Matters
            </Text>
            <Text style={[chatStyles.modal.headerSubtitle, theme && { color: theme.modal.headerSubtitle }]}>
              Built-in support and protection
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[chatStyles.modal.closeButton, theme && { backgroundColor: theme.modal.closeButtonBackground }]}
          >
            <Ionicons name="close" size={20} color={theme?.modal.closeButtonIcon || '#2C2C2C'} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={chatStyles.safeGuard.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Security Features */}
          <View style={chatStyles.safeGuard.section}>
            {features.map((feature, index) => (
              <View key={index} style={chatStyles.safeGuard.featureItem}>
                <View style={[chatStyles.safeGuard.iconContainer, { backgroundColor: feature.color }]}>
                  <Ionicons name={feature.icon as any} size={20} color="#FFFFFF" />
                </View>
                <View style={chatStyles.safeGuard.featureContent}>
                  <Text style={[chatStyles.safeGuard.featureTitle, theme && { color: theme.modal.featureTitle }]}>{feature.title}</Text>
                  <Text style={[chatStyles.safeGuard.featureDescription, theme && { color: theme.modal.featureDescription }]}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Info Card */}
          <View style={[
            chatStyles.safeGuard.infoCard,
            theme && {
              backgroundColor: theme.modal.infoCardBackground,
              borderColor: theme.modal.infoCardBorder,
            }
          ]}>
            <Ionicons name="information-circle" size={24} color={theme?.modal.infoCardIcon || '#5A86FF'} style={{ marginRight: 12 }} />
            <Text style={[chatStyles.safeGuard.infoText, theme && { color: theme.modal.infoCardText }]}>
              SafeGuard is always active, protecting your conversations and personal information around the clock.
            </Text>
          </View>
        </ScrollView>
      </View>
      </View>
    </Modal>
  );
};
