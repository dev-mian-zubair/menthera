/**
 * useEntitlements Hook
 *
 * Provides feature-level entitlement checks for protecting premium/pro features.
 * Simplifies checking if user has access to specific app features.
 */

import { useCallback } from 'react';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { ENTITLEMENTS } from '@/lib/revenuecat/config';

/**
 * Entitlements Hook Return Type
 */
export interface UseEntitlementsReturn {
  // Basic checks
  hasEntitlement: (entitlementId: string) => boolean;
  isByok: () => boolean;

  // Feature-level checks (all features available to all users; BYOK unlocks unlimited usage)
  canCall: () => boolean;
  canChat: () => boolean;

  // Utility
  getRequiredPlanFor: (feature: string) => 'byok' | 'inactive';
}

/**
 * Feature-to-Plan mapping
 * All features require BYOK subscription.
 */
const FEATURE_REQUIREMENTS = {
  chat: 'byok' as const,
  call: 'byok' as const,
  unlimited_messages: 'byok' as const,
  unlimited_calls: 'byok' as const,
};

/**
 * Hook to check user entitlements for features
 *
 * Usage:
 * ```
 * const { canCall, isByok } = useEntitlements();
 *
 * if (!isByok()) {
 *   // User is on free tier with usage limits
 * }
 * ```
 */
export const useEntitlements = (): UseEntitlementsReturn => {
  const { hasEntitlement: checkEntitlement } = useRevenueCat();

  /**
   * Check if user has specific entitlement
   */
  const hasEntitlement = useCallback(
    (entitlementId: string): boolean => {
      return checkEntitlement(entitlementId);
    },
    [checkEntitlement]
  );

  /**
   * Check if user has BYOK entitlement
   */
  const isByok = useCallback((): boolean => {
    return checkEntitlement(ENTITLEMENTS.BYOK);
  }, [checkEntitlement]);

  /**
   * Feature: Make voice/video calls (requires BYOK)
   */
  const canCall = useCallback((): boolean => {
    return checkEntitlement(ENTITLEMENTS.BYOK);
  }, [checkEntitlement]);

  /**
   * Feature: Send messages (requires BYOK)
   */
  const canChat = useCallback((): boolean => {
    return checkEntitlement(ENTITLEMENTS.BYOK);
  }, [checkEntitlement]);

  /**
   * Get required plan for a feature
   */
  const getRequiredPlanFor = useCallback((feature: string): 'byok' | 'inactive' => {
    return (FEATURE_REQUIREMENTS[feature as keyof typeof FEATURE_REQUIREMENTS] || 'byok') as
      | 'byok'
      | 'inactive';
  }, []);

  return {
    // Basic
    hasEntitlement,
    isByok,

    // Features
    canCall,
    canChat,

    // Utility
    getRequiredPlanFor,
  };
};
