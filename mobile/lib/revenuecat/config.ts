/**
 * RevenueCat Configuration
 *
 * This file contains all RevenueCat configuration constants including
 * API keys, product IDs, offering IDs, and entitlement definitions.
 */

import { logger } from '../utils/logger';

// API Keys
export const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

if (!REVENUECAT_API_KEY) {
  logger.warn(
    '⚠️ [RevenueCat] EXPO_PUBLIC_REVENUECAT_API_KEY is not configured. The SDK will not work properly.'
  );
}

/**
 * Entitlements
 * These are permission levels that users gain from purchasing products
 */
export const ENTITLEMENTS = {
  BYOK: 'byok',
} as const;

/**
 * Offerings
 * Groups of products that are presented together in the paywall
 */
export const OFFERINGS = {
  BYOK: 'byok',
} as const;

/**
 * Product IDs (Test Store)
 * These are the product identifiers in RevenueCat's Test Store
 */
export const TEST_PRODUCT_IDS = {
  BYOK_MONTHLY: 'byok_monthly_test',
} as const;

/**
 * Product IDs (Production)
 * These are the product identifiers in App Store and Google Play.
 * Replace these placeholders with your own product IDs after you have
 * configured them in App Store Connect and Google Play Console and linked
 * them in your RevenueCat dashboard.
 */
export const PRODUCTION_PRODUCT_IDS = {
  ios: {
    BYOK_MONTHLY: 'com.example.menthera.subscription.byok.monthly',
  },
  android: {
    BYOK_MONTHLY: 'example_byok_monthly',
  },
} as const;

/**
 * Log Levels
 */
export const LOG_LEVELS = {
  VERBOSE: 'VERBOSE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

/**
 * Default Log Level
 * VERBOSE in development, WARN in production
 */
export const DEFAULT_LOG_LEVEL = __DEV__ ? LOG_LEVELS.VERBOSE : LOG_LEVELS.WARN;
