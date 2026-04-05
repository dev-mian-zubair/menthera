import * as SecureStore from 'expo-secure-store';
import type { TokenCache } from '@clerk/clerk-expo';
import { logger } from '../utils/logger';

// Token cache implementation using Expo SecureStore
// This ensures tokens are stored securely on the device
export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      logger.warn('Failed to get token from SecureStore:', err);
      return null;
    }
  },

  async saveToken(key: string, token: string) {
    try {
      return SecureStore.setItemAsync(key, token);
    } catch (err) {
      logger.warn('Failed to save token to SecureStore:', err);
    }
  },

  async clearToken(key: string) {
    try {
      return SecureStore.deleteItemAsync(key);
    } catch (err) {
      logger.warn('Failed to clear token from SecureStore:', err);
    }
  },
};