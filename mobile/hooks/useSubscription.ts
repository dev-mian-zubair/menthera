/**
 * useSubscription Hook
 *
 * Provides subscription-related utilities and state checks.
 * Determines user plan, checks entitlements, and manages subscription info.
 */

import { useCallback, useMemo } from 'react';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { ENTITLEMENTS } from '@/lib/revenuecat/config';

/**
 * Subscription Hook Return Type
 */
export interface UseSubscriptionReturn {
  // Entitlement checks
  isByok: () => boolean;
  isSubscribed: () => boolean;
  hasAnyEntitlement: (entitlementIds: string[]) => boolean;

  // Plan info
  getCurrentPlan: () => 'inactive' | 'byok';
  getActiveSubscription: () => any | null;

  // State
  plan: 'inactive' | 'byok';
  subscription: any | null;
  customerInfo: any | null;

  // Methods
  refresh: () => Promise<void>;
}

/**
 * Hook to manage subscription state and checks
 *
 * Usage:
 * ```
 * const { isByok, plan, getActiveSubscription } = useSubscription();
 *
 * if (!isByok()) {
 *   // Show upgrade prompt
 * }
 * ```
 */
export const useSubscription = (): UseSubscriptionReturn => {
  const { customerInfo, hasEntitlement, refresh } = useRevenueCat();

  /**
   * Check if user has BYOK entitlement
   */
  const isByok = useCallback((): boolean => {
    return hasEntitlement(ENTITLEMENTS.BYOK);
  }, [hasEntitlement]);

  /**
   * Check if user has any subscription
   */
  const isSubscribed = useCallback((): boolean => {
    return isByok();
  }, [isByok]);

  /**
   * Check if user has any of the given entitlements
   */
  const hasAnyEntitlement = useCallback(
    (entitlementIds: string[]): boolean => {
      return entitlementIds.some((id) => hasEntitlement(id));
    },
    [hasEntitlement]
  );

  /**
   * Get current plan based on entitlements
   */
  const getCurrentPlan = useCallback((): 'inactive' | 'byok' => {
    if (isByok()) return 'byok';
    return 'inactive';
  }, [isByok]);

  /**
   * Get active subscription details
   */
  const getActiveSubscription = useCallback((): any | null => {
    if (!customerInfo?.entitlements.active) return null;

    const activeEntitlements = Object.values(customerInfo.entitlements.active);
    return activeEntitlements[0] || null;
  }, [customerInfo]);

  /**
   * Memoized computed values
   */
  const plan = useMemo(() => getCurrentPlan(), [getCurrentPlan]);
  const subscription = useMemo(() => getActiveSubscription(), [getActiveSubscription]);

  return {
    // Checks
    isByok,
    isSubscribed,
    hasAnyEntitlement,

    // Plan info
    getCurrentPlan,
    getActiveSubscription,

    // State
    plan,
    subscription,
    customerInfo,

    // Methods
    refresh,
  };
};
