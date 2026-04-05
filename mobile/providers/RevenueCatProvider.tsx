/**
 * RevenueCat Provider
 *
 * Provides global RevenueCat SDK state and context to the entire app.
 * Handles SDK initialization, user login, and subscription state management.
 */

import React, { createContext, useEffect, useState, useContext, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import Purchases, { CustomerInfo, PurchasesError, PurchasesOffering } from 'react-native-purchases';
import { REVENUECAT_API_KEY, DEFAULT_LOG_LEVEL } from '@/lib/revenuecat/config';
import { logger } from '@/lib/utils/logger';

/**
 * RevenueCat Context Type
 */
interface RevenueCatContextType {
  // State
  offerings: PurchasesOffering[] | null;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  error: string | null;

  // Helper methods
  hasEntitlement: (entitlementId: string) => boolean;
  refresh: () => Promise<void>;
  isReady: boolean;
}

/**
 * Create context with undefined default
 */
const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

/**
 * RevenueCat Provider Component
 *
 * Wraps the app with RevenueCat SDK initialization and state management.
 * Automatically syncs Clerk user ID with RevenueCat.
 */
export const RevenueCatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userId, isSignedIn } = useAuth();

  const [offerings, setOfferings] = useState<PurchasesOffering[] | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  /**
   * Initialize RevenueCat SDK on app launch
   */
  useEffect(() => {
    initializeRevenueCat();
  }, []);

  /**
   * Update RevenueCat user when Clerk user changes
   */
  useEffect(() => {
    if (!isReady || !isSignedIn || !userId) {
      return;
    }

    setRevenueCatUser(userId);
  }, [userId, isSignedIn, isReady]);

  /**
   * Initialize RevenueCat SDK
   */
  const initializeRevenueCat = async () => {
    try {
      if (!REVENUECAT_API_KEY) {
        throw new Error('EXPO_PUBLIC_REVENUECAT_API_KEY is not configured');
      }

      logger.debug('[RevenueCat] Initializing SDK...');

      // Set log level
      Purchases.setLogLevel(Purchases.LOG_LEVEL[DEFAULT_LOG_LEVEL as keyof typeof Purchases.LOG_LEVEL]);

      // Configure with API key
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
      });

      logger.debug('✅ [RevenueCat] SDK initialized successfully');
      setError(null);
    } catch (err: any) {
      const message = err?.message || 'Failed to initialize RevenueCat';
      logger.error('❌ [RevenueCat] Initialization error:', message);
      setError(message);
    } finally {
      setIsReady(true);
    }
  };

  /**
   * Set RevenueCat user from Clerk user ID
   */
  const setRevenueCatUser = async (appUserId: string) => {
    try {
      logger.debug(`[RevenueCat] Setting user: ${appUserId}`);

      // Log in to RevenueCat with Clerk user ID
      await Purchases.logIn(appUserId);

      // Fetch offerings and customer info
      await fetchOfferingsAndCustomerInfo();

      logger.debug('✅ [RevenueCat] User logged in successfully');
    } catch (err: any) {
      const message = err?.message || 'Failed to set RevenueCat user';
      logger.error('❌ [RevenueCat] Set user error:', message);
      setError(message);
      setIsLoading(false);
    }
  };

  /**
   * Fetch offerings and customer info
   */
  const fetchOfferingsAndCustomerInfo = async () => {
    try {
      setIsLoading(true);

      const offerings = await Purchases.getOfferings();
      const customerInfo = await Purchases.getCustomerInfo();

      // Convert offerings object to array
      const offeringsArray = offerings.all ? Object.values(offerings.all) : null;

      setOfferings(offeringsArray);
      setCustomerInfo(customerInfo);
      setError(null);

      if (offeringsArray) {
        logger.debug(`✅ [RevenueCat] Loaded ${offeringsArray.length} offerings`);
      }

      if (customerInfo?.entitlements.active) {
        const activeEntitlements = Object.keys(customerInfo.entitlements.active);
        logger.debug(`✅ [RevenueCat] Active entitlements: ${activeEntitlements.join(', ') || 'none'}`);
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to fetch offerings';
      logger.error('❌ [RevenueCat] Fetch error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if user has specific entitlement
   */
  const hasEntitlement = (entitlementId: string): boolean => {
    if (!customerInfo) return false;
    return customerInfo.entitlements.active[entitlementId] !== undefined;
  };

  /**
   * Refresh customer info and offerings
   */
  const refresh = async () => {
    try {
      logger.debug('[RevenueCat] Refreshing customer info...');
      await fetchOfferingsAndCustomerInfo();
      logger.debug('✅ [RevenueCat] Refresh successful');
    } catch (err: any) {
      const message = err?.message || 'Failed to refresh';
      logger.error('❌ [RevenueCat] Refresh error:', message);
      setError(message);
    }
  };

  return (
    <RevenueCatContext.Provider
      value={{
        offerings,
        customerInfo,
        isLoading,
        error,
        hasEntitlement,
        refresh,
        isReady,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
};

/**
 * Hook to use RevenueCat context
 *
 * Usage:
 * ```
 * const { offerings, customerInfo, hasEntitlement } = useRevenueCat();
 * ```
 */
export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);

  if (!context) {
    throw new Error('useRevenueCat must be used within RevenueCatProvider');
  }

  return context;
};
