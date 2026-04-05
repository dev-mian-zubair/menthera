/**
 * Subscription Quota Configuration
 *
 * Centralized configuration for all subscription plan limits.
 * BYOK-only model: users are either inactive (no subscription) or BYOK (unlimited).
 */

export type SubscriptionPlan = 'inactive' | 'byok';

export interface PlanQuota {
  /** Monthly voice call minutes */
  minutes: number;
  /** Monthly chat messages */
  messages: number;
}

/**
 * Subscription quotas by plan tier
 */
export const SUBSCRIPTION_QUOTAS: Record<SubscriptionPlan, PlanQuota> = {
  inactive: {
    minutes: 0,
    messages: 0,
  },
  byok: {
    minutes: 999999,
    messages: 999999,
  },
};

/**
 * Get quota for a specific plan
 * Falls back to inactive tier if plan is not recognized
 */
export function getQuotaForPlan(plan: string): PlanQuota {
  const normalizedPlan = plan?.toLowerCase() as SubscriptionPlan;
  return SUBSCRIPTION_QUOTAS[normalizedPlan] || SUBSCRIPTION_QUOTAS.inactive;
}

/**
 * Default quota (inactive) for new users
 */
export const DEFAULT_QUOTA = SUBSCRIPTION_QUOTAS.inactive;
