// User API module (Simplified for Clerk integration)
import { apiClient } from './client';
import { ApiResponse } from './config';
import { logger } from '../utils/logger';

export interface UsageMetrics {
  used: number;
  total: number;
  remaining: number;
  percentageUsed: number;
}

export interface UserUsage {
  userId: string;
  plan: 'inactive' | 'byok';
  minutes: UsageMetrics;
  messages: UsageMetrics;
  resetDate: Date;
  createdAt: Date;
  lastUpdated: Date;
  isByok?: boolean;
  isActive?: boolean;
  hasApiKey?: boolean;
}

export interface ApiKeyInfo {
  hasKey: boolean;
  keyPrefix?: string;
  keySuffix?: string;
  validatedAt?: string;
}

export const userApi = {
  /**
   * GET /users/usage - Get user's usage statistics
   */
  async getUsage(): Promise<ApiResponse<UserUsage>> {
    try {
      // Send device timezone so the backend can calculate resets at midnight local time
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await apiClient.get<any>(`/users/usage?timezone=${encodeURIComponent(timezone)}`);

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to fetch usage statistics',
        };
      }

      // Backend returns: { success, data: {...}, message, timestamp }
      // apiClient wraps it as: { success: true, data: { success, data: {...}, message, timestamp } }
      const backendResponse = response.data;

      logger.debug('[User API] 🔍 Response structure:', {
        hasDataProperty: 'data' in backendResponse,
        dataType: typeof backendResponse.data,
        isDataObject: backendResponse.data && typeof backendResponse.data === 'object',
        keys: Object.keys(backendResponse).slice(0, 5),
      });

      // Extract the inner data object if it exists
      let usageData = backendResponse;
      if (backendResponse.data && typeof backendResponse.data === 'object') {
        usageData = backendResponse.data;
        logger.debug('[User API] Extracted inner data object');
      }

      // Transform response: convert date strings to Date objects
      const transformedUsage: UserUsage = {
        userId: usageData.userId,
        plan: usageData.plan,
        minutes: usageData.minutes,
        messages: usageData.messages,
        resetDate: usageData.resetDate ? new Date(usageData.resetDate) : new Date(),
        createdAt: usageData.createdAt ? new Date(usageData.createdAt) : new Date(),
        lastUpdated: usageData.lastUpdated ? new Date(usageData.lastUpdated) : new Date(),
        isByok: usageData.isByok,
        hasApiKey: usageData.hasApiKey,
      };

      logger.debug('[User API] ✓ Usage data retrieved:', {
        plan: transformedUsage.plan,
        minutes: transformedUsage.minutes,
        messages: transformedUsage.messages,
        resetDate: transformedUsage.resetDate,
      });

      logger.debug('[User API] 📊 Full transformed usage object:', JSON.stringify(transformedUsage, null, 2));

      return {
        success: true,
        data: transformedUsage,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('[User API] ✗ Error fetching usage:', errorMessage, error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * POST /users/onboarding - Update user's preferred language
   */
  async updateLanguage(preferredLanguage: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/users/onboarding', { preferredLanguage });
      if (!response.success) {
        return { success: false, error: response.error || 'Failed to update language' };
      }
      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  },

  /**
   * DELETE /api/user/account - Delete user account
   */
  async deleteAccount(): Promise<ApiResponse<void>> {
    return apiClient.delete('/user/account');
  },

  /**
   * POST /users/api-key - Store user's Gemini API key
   */
  async storeApiKey(apiKey: string): Promise<ApiResponse<{ stored: boolean }>> {
    try {
      const response = await apiClient.post<any>('/users/api-key', { apiKey });
      if (!response.success) {
        return { success: false, error: response.error || 'Failed to store API key' };
      }
      const data = response.data?.data || response.data;
      return { success: true, data: { stored: data.stored } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  },

  /**
   * GET /users/api-key - Get masked API key info
   */
  async getApiKeyInfo(): Promise<ApiResponse<ApiKeyInfo>> {
    try {
      const response = await apiClient.get<any>('/users/api-key');
      if (!response.success) {
        return { success: false, error: response.error || 'Failed to get API key info' };
      }
      const data = response.data?.data || response.data;
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  },

  /**
   * DELETE /users/api-key - Remove stored API key
   */
  async removeApiKey(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete<any>('/users/api-key');
      if (!response.success) {
        return { success: false, error: response.error || 'Failed to remove API key' };
      }
      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  },
};