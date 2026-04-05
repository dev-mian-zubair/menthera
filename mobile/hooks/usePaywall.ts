/**
 * usePaywall Hook
 *
 * Handles RevenueCat paywall presentation and purchase flow.
 * Provides methods to show paywalls and handle purchase results.
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import Purchases, { PURCHASES_ERROR_CODE, PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { logger } from '@/lib/utils/logger';

/**
 * Paywall Hook Return Type
 */
export interface UsePaywallReturn {
  presentPaywall: (pkg?: PurchasesPackage) => Promise<{
    success: boolean;
    cancelled?: boolean;
    error?: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to manage paywall presentation and purchases
 *
 * Usage:
 * ```
 * const { presentPaywall, isLoading } = usePaywall();
 *
 * const handlePurchase = async (pkg) => {
 *   const result = await presentPaywall(pkg);
 *   if (result.success) {
 *     // Show success message
 *   }
 * };
 * ```
 */
export const usePaywall = (): UsePaywallReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refresh } = useRevenueCat();

  /**
   * Present RevenueCat remote paywall and handle purchase
   */
  const presentPaywall = useCallback(
    async (pkg?: PurchasesPackage) => {
      try {
        setIsLoading(true);
        setError(null);

        if (pkg) {
          logger.debug(`🛒 [Paywall] Starting paywall presentation: ${pkg.product.title}`);
          logger.debug(`💰 [Paywall] Price: ${pkg.product.priceString}`);
          logger.debug(`📦 [Paywall] Package: ${pkg.identifier}`);
        }

        // Present the beautiful RevenueCat remote paywall UI
        logger.debug(`📱 [Paywall] Presenting RevenueCat remote paywall...`);

        const paywallResult = await RevenueCatUI.presentPaywall({
          displayCloseButton: true,
        });

        logger.debug(`📱 [Paywall] Paywall result:`, paywallResult);
        logger.debug(`📊 [Paywall] Available results:`, {
          PURCHASED: PAYWALL_RESULT.PURCHASED,
          CANCELLED: PAYWALL_RESULT.CANCELLED,
          RESTORED: PAYWALL_RESULT.RESTORED,
        });

        // Check the paywall result
        if (
          paywallResult === PAYWALL_RESULT.CANCELLED ||
          paywallResult === PAYWALL_RESULT.ERROR
        ) {
          logger.debug('⚠️ [Paywall] User dismissed paywall without purchasing');
          return {
            success: false,
            cancelled: true,
          };
        }

        if (paywallResult === PAYWALL_RESULT.PURCHASED || paywallResult === PAYWALL_RESULT.RESTORED) {
          // Refresh to get updated subscription info
          logger.debug(`🔄 [Paywall] Refreshing subscription info...`);
          await refresh();

          // Get updated customer info to check if purchase was successful
          const updatedCustomerInfo = await Purchases.getCustomerInfo();
          const activeEntitlements = Object.keys(updatedCustomerInfo.entitlements.active);

          logger.debug(`✅ [Paywall] Purchase successful!`);
          logger.debug(`🎉 [Paywall] Active entitlements: ${activeEntitlements.join(', ') || 'none'}`);

          return {
            success: true,
            customerInfo: updatedCustomerInfo,
          };
        }

        logger.debug(`ℹ️ [Paywall] Paywall dismissed with result: ${paywallResult}`);
        return {
          success: false,
          cancelled: true,
        };
      } catch (err: any) {
        // Handle user cancellation
        if (err.userCancelled || err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          logger.debug('⚠️ [Paywall] User cancelled purchase');
          return {
            success: false,
            cancelled: true,
          };
        }

        // Debug: Log full error object with all details
        logger.error('❌ [Paywall] Full error object:', err);
        logger.error('❌ [Paywall] Error details:', {
          code: err.code,
          message: err.message,
          userCancelled: err.userCancelled,
          domain: err.domain,
          localizedMessage: err.localizedMessage,
          stack: err.stack,
        });

        // Handle other errors
        const errorMessage = err.message || JSON.stringify(err);
        logger.error(`❌ [Paywall] Purchase error: ${errorMessage}`);

        setError(errorMessage);

        // Show error alert with full details
        Alert.alert('Purchase Failed', `${errorMessage}\n\nCode: ${err.code || 'unknown'}`, [
          {
            text: 'OK',
            onPress: () => setError(null),
          },
        ]);

        return {
          success: false,
          cancelled: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [refresh]
  );

  return {
    presentPaywall,
    isLoading,
    error,
  };
};
