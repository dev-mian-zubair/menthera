// Base API client for making HTTP requests
import { API_CONFIG, ApiError, ApiResponse, RequestConfig } from './config';
import { logger } from '../utils/logger';

// Type for token getter function
type TokenGetter = () => Promise<string | null>;

/**
 * Base API client class - handles HTTP requests with authentication
 */
export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private tokenGetter: TokenGetter | null = null;
  private retryTokenAttempts = 3;
  private retryTokenDelay = 50; // ms

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Set a function to dynamically get auth tokens (e.g., from Clerk)
   * Call this in your app setup to enable automatic token injection
   */
  setTokenGetter(getter: TokenGetter) {
    this.tokenGetter = getter;
    logger.debug('[API Client] Token getter configured');
  }

  /**
   * Set authentication token for API requests (static token)
   */
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Get token with retry logic
   * If token getter returns null on first try, retry a few times
   * This handles cases where Clerk is still initializing the session
   */
  private async getTokenWithRetry(): Promise<string | null> {
    if (!this.tokenGetter) {
      logger.warn('[API Client] No token getter configured');
      return null;
    }

    for (let attempt = 1; attempt <= this.retryTokenAttempts; attempt++) {
      try {
        const token = await this.tokenGetter();
        if (token) {
          if (attempt > 1) {
            logger.debug(`[API Client] Token obtained on attempt ${attempt}/${this.retryTokenAttempts}`);
          }
          return token;
        }

        // Token is null, retry if we have more attempts
        if (attempt < this.retryTokenAttempts) {
          logger.debug(`[API Client] Token was null (attempt ${attempt}/${this.retryTokenAttempts}), retrying in ${this.retryTokenDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.retryTokenDelay));
        }
      } catch (error) {
        logger.error(`[API Client] Error getting token on attempt ${attempt}:`, error);
        if (attempt < this.retryTokenAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryTokenDelay));
        }
      }
    }

    logger.warn(`[API Client] Failed to get token after ${this.retryTokenAttempts} attempts`);
    return null;
  }

  /**
   * Generic request method with detailed logging
   */
  private async request<T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      data?: any;
      params?: Record<string, any>;
      config?: RequestConfig;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', data, params, config = {} } = options;

    // Build URL - properly concatenate base URL with endpoint
    // Remove trailing slash from baseURL and leading slash from endpoint to avoid double slashes
    const cleanBaseURL = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const urlString = `${cleanBaseURL}${cleanEndpoint}`;

    const url = new URL(urlString);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const fullUrl = url.toString();
    logger.debug(`[API Client] → ${method} ${fullUrl}`);

    try {
      // Get dynamic token if token getter is configured
      const headers = { ...this.defaultHeaders };
      if (this.tokenGetter) {
        try {
          logger.debug('[API Client] Attempting to get Clerk token...');
          const token = await this.getTokenWithRetry();
          logger.debug('[API Client] Token getter returned:', {
            tokenExists: !!token,
            tokenLength: token?.length || 0,
          });
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            logger.debug('[API Client] ✓ Authorization header set with Clerk token');
          } else {
            logger.warn('[API Client] ⚠ Token getter returned null after retries - request will not be authenticated');
          }
        } catch (error) {
          logger.error('[API Client] Unexpected error getting dynamic token:', error);
          // Fall back to static token if available
          if (this.defaultHeaders['Authorization']) {
            logger.debug('[API Client] Using static authorization header');
          }
        }
      } else {
        logger.warn('[API Client] ⚠ No token getter configured - requests will not be authenticated');
      }

      // Configure request
      const requestConfig: RequestInit = {
        method,
        headers: {
          ...headers,
          ...config.headers,
        },
      };

      // Add body for POST/PUT requests
      if (data && ['POST', 'PUT'].includes(method)) {
        requestConfig.body = JSON.stringify(data);
        logger.debug(`[API Client] Request body:`, data);
        logger.debug(`[API Client] Body field analysis:`, {
          endpoint,
          method,
          fields: Object.entries(data).map(([key, value]) => ({
            key,
            value,
            type: typeof value,
            isNull: value === null,
            isEmpty: value === '',
          })),
        });
      }

      // Set timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || API_CONFIG.TIMEOUT);
      requestConfig.signal = controller.signal;

      const startTime = Date.now();
      const headerKeys = Object.keys(requestConfig.headers || {});
      logger.debug(`[API Client] Headers (${headerKeys.length}):`, {
        hasAuth: headerKeys.includes('Authorization'),
        keys: headerKeys,
      });

      // Make request
      const response = await fetch(fullUrl, requestConfig);
      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      logger.debug(`[API Client] ← ${response.status} ${response.statusText} (${duration}ms)`, {
        'Content-Type': response.headers.get('content-type'),
      });

      // Get content type to determine how to parse response
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      let responseData: any;
      let responseText: string = '';

      if (isJson) {
        try {
          responseData = await response.json();
          logger.debug(`[API Client] Response data:`, responseData);
          logger.debug(`[API Client] COMPLETE RESPONSE STRUCTURE:`, JSON.stringify(responseData, null, 2));
        } catch (parseError) {
          // If JSON parsing fails, log the raw response
          responseText = await response.text();
          logger.error(`[API Client] Failed to parse JSON response:`, responseText.substring(0, 200));
          responseData = { error: 'Invalid JSON response from server' };
        }
      } else {
        // If not JSON, get text response
        responseText = await response.text();
        logger.warn(`[API Client] Response is not JSON (Content-Type: ${contentType}):`, responseText.substring(0, 200));
        responseData = { error: `Server error: ${response.status} ${response.statusText}` };
      }

      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || `HTTP ${response.status}: ${response.statusText}`;
        logger.error(`[API Client] ✗ Error: ${errorMessage}`);
        throw new ApiError(
          errorMessage,
          response.status,
          responseData
        );
      }

      logger.debug(`[API Client] ✓ Success`);
      // Backend returns { success, data, timestamp, message }
      // Extract the data field to avoid double-wrapping
      return {
        success: true,
        data: responseData.data || responseData,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error(`[API Client] ✗ ApiError:`, error.message);
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`[API Client] ✗ Exception:`, errorMessage, error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params, config });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', data, config });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', data, config });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', config });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
