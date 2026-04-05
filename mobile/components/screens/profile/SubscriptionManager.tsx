/**
 * SubscriptionManager Component
 *
 * Displays current subscription status and handles upgrade/restore functionality.
 * Integrates with RevenueCat paywall for purchase flow.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RevenueCatUI from 'react-native-purchases-ui';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaywall } from '@/hooks/usePaywall';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import Purchases from 'react-native-purchases';
import { getTimeTheme } from '@/lib/utils/time-theme';
import { logger } from '@/lib/utils/logger';

interface SubscriptionManagerProps {
  onPaywallShown?: () => void;
}

/**
 * SubscriptionManager Component
 *
 * Features:
 * - Display current plan
 * - Show renewal date
 * - Upgrade to Premium button
 * - Restore purchases
 * - Cancel subscription (for existing subscribers)
 */
export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ onPaywallShown }) => {
  const { plan, subscription, isByok, refresh } = useSubscription();
  const { presentPaywall, isLoading: purchaseLoading, error: purchaseError } = usePaywall();
  const { offerings, isLoading: offeringsLoading } = useRevenueCat();
  const [isRestoring, setIsRestoring] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const theme = useMemo(() => getTimeTheme(), []);

  /**
   * Handle upgrade button press - show fullscreen paywall modal
   */
  const handleUpgradePress = async () => {
    try {
      // Get the BYOK offering
      const byokOffering = offerings?.find((o) => o.identifier === 'byok');

      if (!byokOffering || !byokOffering.availablePackages.length) {
        Alert.alert('Error', 'No offerings available. Please try again later.');
        return;
      }

      onPaywallShown?.();

      logger.debug('[SubscriptionManager] Opening fullscreen paywall modal');
      setShowPaywallModal(true);
    } catch (error: any) {
      logger.error('[SubscriptionManager] Upgrade error:', error);
      Alert.alert('Error', error?.message || 'Failed to show paywall');
    }
  };

  /**
   * Handle paywall purchase completion
   */
  const handlePaywallPurchaseCompleted = async () => {
    logger.debug('[SubscriptionManager] Purchase completed');
    setShowPaywallModal(false);
    await refresh();
    Alert.alert('Success', 'Welcome to BYOK! Set up your API key in profile settings.', [
      {
        text: 'OK',
      },
    ]);
  };

  /**
   * Handle paywall dismissal
   */
  const handlePaywallDismiss = () => {
    logger.debug('[SubscriptionManager] Paywall dismissed');
    setShowPaywallModal(false);
  };

  /**
   * Handle restore purchases button press
   */
  const handleRestorePress = async () => {
    try {
      setIsRestoring(true);

      logger.debug('[SubscriptionManager] Restoring purchases...');

      const restored = await Purchases.restorePurchases();

      const activeEntitlements = Object.keys(restored.entitlements.active);

      logger.debug('[SubscriptionManager] Restored entitlements:', activeEntitlements);

      if (activeEntitlements.length > 0) {
        Alert.alert('Success', `Restored: ${activeEntitlements.join(', ')}`, [
          {
            text: 'OK',
            onPress: () => refresh(),
          },
        ]);
      } else {
        Alert.alert('No Purchases', 'No previous purchases found to restore.');
      }
    } catch (error: any) {
      logger.error('[SubscriptionManager] Restore error:', error);
      Alert.alert('Error', error?.message || 'Failed to restore purchases');
    } finally {
      setIsRestoring(false);
    }
  };

  /**
   * Handle cancel subscription
   */
  const handleCancelPress = () => {
    Alert.alert(
      'Cancel Subscription?',
      'Are you sure you want to cancel your subscription? You can manage your subscription in the App Store or Google Play.',
      [
        { text: 'Keep Subscription', onPress: () => {} },
        {
          text: 'Cancel Subscription',
          onPress: () => {
            Alert.alert(
              'Open App Store',
              'Please open the App Store (iOS) or Google Play (Android) to manage or cancel your subscription.',
              [{ text: 'OK' }]
            );
          },
          style: 'destructive',
        },
      ]
    );
  };

  const isLoading = offeringsLoading || purchaseLoading || isRestoring;

  // Define inline styles matching the profile.styles.ts design system with dynamic theme colors
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

    planCard: {
      backgroundColor: theme.profile.userCardBackground,
      borderRadius: 28,
      padding: 20,
      marginBottom: 16,
    } as ViewStyle,

    planLabel: {
      fontSize: 12,
      fontFamily: 'SFProDisplayMedium',
      color: theme.profile.menuItemSubtitle,
      marginBottom: 8,
      letterSpacing: -0.1,
    } as TextStyle,

    planName: {
      fontSize: 32,
      fontFamily: 'SFProDisplayBold',
      color: theme.profile.userName,
      marginBottom: 16,
      letterSpacing: -0.5,
      textTransform: 'capitalize',
    } as TextStyle,

    planBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.quickAction.primaryBackground,
      marginBottom: 12,
      alignSelf: 'flex-start',
    } as ViewStyle,

    planBadgeText: {
      fontSize: 12,
      fontFamily: 'SFProDisplayMedium',
      color: '#FFFFFF',
      letterSpacing: -0.1,
    } as TextStyle,

    renewalSection: {
      borderTopWidth: 1,
      borderTopColor: theme.usageCard.dividerColor,
      paddingTop: 12,
      marginTop: 12,
    } as ViewStyle,

    renewalLabel: {
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: theme.profile.menuItemSubtitle,
      marginBottom: 6,
    } as TextStyle,

    renewalDate: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: theme.profile.userName,
      letterSpacing: -0.2,
    } as TextStyle,

    emptyStateText: {
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: theme.profile.menuItemSubtitle,
      marginTop: 12,
      lineHeight: 18,
    } as TextStyle,

    buttonRow: {
      gap: 12,
      marginBottom: 16,
    } as ViewStyle,

    upgradeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      backgroundColor: theme.quickAction.primaryBackground,
      borderRadius: 28,
    } as ViewStyle,

    upgradeButtonText: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: '#FFFFFF',
      letterSpacing: -0.2,
      marginLeft: 8,
    } as TextStyle,

    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: theme.profile.menuItemBackground,
      borderRadius: 28,
    } as ViewStyle,

    cancelButtonText: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: '#DC2626',
      letterSpacing: -0.2,
      marginLeft: 8,
    } as TextStyle,

    restoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      backgroundColor: theme.profile.menuItemBackground,
      borderRadius: 28,
    } as ViewStyle,

    restoreButtonText: {
      fontSize: 15,
      fontFamily: 'SFProDisplaySemibold',
      color: theme.profile.menuItemTitle,
      letterSpacing: -0.2,
      marginLeft: 8,
    } as TextStyle,

    infoText: {
      fontSize: 12,
      fontFamily: 'SFProDisplayRegular',
      color: theme.profile.menuItemSubtitle,
      textAlign: 'center',
      lineHeight: 16,
    } as TextStyle,

    errorBanner: {
      backgroundColor: theme.profile.dangerZoneBackground,
      borderRadius: 28,
      padding: 16,
      marginBottom: 16,
    } as ViewStyle,

    errorText: {
      fontSize: 13,
      fontFamily: 'SFProDisplayRegular',
      color: '#DC2626',
      lineHeight: 18,
    } as TextStyle,
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Text style={styles.header}>Subscription Plan</Text>

      {/* Current Plan Card */}
      <View style={styles.planCard}>
        {/* Plan Badge */}
        {plan === 'byok' && (
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              BYOK
            </Text>
          </View>
        )}

        {/* Plan Label */}
        <Text style={styles.planLabel}>Current Plan</Text>

        {/* Plan Name */}
        <Text style={styles.planName}>{plan}</Text>

        {/* Renewal Information - Only show if subscribed */}
        {subscription && plan === 'byok' && (
          <View style={styles.renewalSection}>
            <Text style={styles.renewalLabel}>Renews on</Text>
            <Text style={styles.renewalDate}>
              {new Date(subscription.expirationDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}
      </View>

      {/* Error Banner */}
      {purchaseError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{purchaseError}</Text>
        </View>
      )}

      {/* Buttons */}
      <View style={styles.buttonRow}>
        {/* Cancel Subscription Button - Show for BYOK subscribers */}
        {isByok() && (
          <TouchableOpacity
            onPress={handleCancelPress}
            style={styles.cancelButton}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
          </TouchableOpacity>
        )}

        {/* Restore Purchases Button */}
        <TouchableOpacity
          onPress={handleRestorePress}
          disabled={isLoading || isRestoring}
          style={[styles.restoreButton, (isLoading || isRestoring) && { opacity: 0.5 }]}
          activeOpacity={0.8}
        >
          {isRestoring ? (
            <ActivityIndicator color={theme.profile.menuItemTitle} size="small" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color={theme.profile.menuItemTitle} />
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info Text */}
      <Text style={styles.infoText}>
        Subscriptions renew automatically. Manage or cancel your subscription anytime in the App Store or Google Play.
      </Text>

      {/* Fullscreen Paywall Modal */}
      <Modal
        visible={showPaywallModal}
        animationType="slide"
        transparent={false}
      >
        <View style={{ flex: 1 }}>
          <RevenueCatUI.Paywall
            options={{
              offering: offerings?.find((o) => o.identifier === 'byok') || undefined,
            }}
            onPurchaseCompleted={handlePaywallPurchaseCompleted}
            onDismiss={handlePaywallDismiss}
            onPurchaseCancelled={handlePaywallDismiss}
            onPurchaseError={() => {
              setShowPaywallModal(false);
            }}
            style={{ flex: 1 }}
          />
        </View>
      </Modal>
    </View>
  );
};
