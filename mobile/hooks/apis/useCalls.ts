import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { callsApi, CallRequest, CallSession, isApiSuccess } from '@/lib/api';
import type { PaginationParams } from '@/lib/api/config';
import { API_CONFIG } from '@/lib/api/config';
import { CallHistory } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

export const useCallHistory = (params?: PaginationParams) => {
  const [calls, setCalls] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    logger.debug('[useCallHistory] 🔄 Starting call history fetch...');
    setLoading(true);
    setError(null);

    try {
      logger.debug('[useCallHistory] Calling callsApi.getCallHistory()...');
      const response = await callsApi.getCallHistory(params);

      logger.debug('[useCallHistory] Response received:', {
        success: isApiSuccess(response),
        dataLength: isApiSuccess(response) ? response.data?.length : 'N/A',
        error: !isApiSuccess(response) ? response.error : 'N/A',
      });

      if (isApiSuccess(response)) {
        logger.debug('[useCallHistory] ✓ Success - Setting', response.data.length, 'calls');
        setCalls(response.data);
      } else {
        logger.error('[useCallHistory] ✗ Error response:', response.error);
        setError(response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      logger.error('[useCallHistory] ✗ Exception:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [params?.offset, params?.limit]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const refetch = useCallback(() => {
    fetchCalls();
  }, [fetchCalls]);

  return {
    calls,
    loading,
    error,
    refetch,
  };
};

export const useCallSession = (callId: string) => {
  const [session, setSession] = useState<CallSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!callId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await callsApi.getCallSession(callId);

      if (response.success) {
        setSession(response.data);
      } else {
        setError(response.error || 'Failed to fetch call session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [callId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const refetch = useCallback(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook to initiate a call with proper JWT authentication
 * Handles Clerk token injection at request time
 */
export const useInitiateCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const initiateCall = useCallback(
    async (request: CallRequest): Promise<CallSession | null> => {
      setLoading(true);
      setError(null);

      try {
        // Get JWT token at request time (not at hook init)
        let token: string | null = null;
        try {
          logger.debug('[useInitiateCall] Calling getToken() for Clerk JWT...');
          token = await getToken();
          logger.debug('[useInitiateCall] Token retrieved:', {
            hasToken: !!token,
            tokenLength: token?.length || 0,
          });
        } catch (tokenError) {
          logger.error('[useInitiateCall] Failed to get Clerk token:', tokenError);
          throw new Error('Failed to get authentication token');
        }

        // Make authenticated request manually to ensure token is properly sent
        const baseURL = API_CONFIG.BASE_URL.endsWith('/')
          ? API_CONFIG.BASE_URL.slice(0, -1)
          : API_CONFIG.BASE_URL;

        const endpoint = '/call';
        const url = `${baseURL}${endpoint}`;

        logger.debug('[useInitiateCall] Making authenticated request:', {
          url,
          hasToken: !!token,
          method: 'POST',
        });

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 30000); // 30 second timeout

        let response;
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(request),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            const timeoutError = 'Connection timeout. Please check your network and try again.';
            logger.error('[useInitiateCall] Request timeout');
            setError(timeoutError);
            return null;
          }
          throw fetchError;
        }

        const responseData = await response.json();

        if (!response.ok) {
          // Log full response for debugging
          logger.error('[useInitiateCall] Full error response:', JSON.stringify(responseData, null, 2));

          // Check for quota exceeded error (various formats)
          if (response.status === 403) {
            // Check if it's a quota error
            if (responseData.errorCode === 'QUOTA_EXCEEDED' ||
                responseData.error?.includes('quota') ||
                responseData.error?.includes('Quota') ||
                responseData.message?.includes('quota') ||
                responseData.message?.includes('Quota')) {
              logger.warn('[useInitiateCall] ⚠️ Quota exceeded:', responseData.quota || responseData);
              // Create a special error that includes quota info
              const quotaError: any = new Error('Call minutes quota exceeded');
              quotaError.code = 'QUOTA_EXCEEDED';
              quotaError.quota = responseData.quota || {
                used: 0,
                total: 0,
                remaining: 0,
                resetDate: new Date().toISOString()
              };
              throw quotaError;
            }
          }

          // Extract error message from various possible formats
          let errorMessage =
            responseData.error ||
            responseData.message ||
            responseData.data?.error ||
            responseData.data?.message ||
            null;

          // Provide helpful default messages for common status codes
          if (!errorMessage) {
            switch (response.status) {
              case 403:
                errorMessage = 'You have reached your monthly call minutes limit. Please upgrade your plan to continue.';
                break;
              case 401:
                errorMessage = 'Authentication failed. Please sign in again.';
                break;
              case 429:
                errorMessage = 'Too many requests. Please try again in a moment.';
                break;
              case 500:
              case 502:
              case 503:
                errorMessage = 'Server error. Please try again later.';
                break;
              default:
                errorMessage = `Request failed (Error ${response.status}). Please try again.`;
            }
          }

          logger.error('[useInitiateCall] API Error:', errorMessage);
          setError(errorMessage);
          return null;
        }

        // Backend returns { success: true, data: {...} } - extract the data
        const data = responseData.success ? responseData.data : responseData;

        // Map backend response to CallSession
        const callSession: CallSession = {
          id: data.callId,
          agentId: request.agentId,
          type: request.type,
          status: 'connecting',
          startTime: new Date(),
          roomUrl: data.roomUrl,
          token: data.userToken,
          roomName: data.roomName,
          taskArn: data.taskArn,
          roomReused: data.roomReused,
          assignmentMethod: data.assignmentMethod,
          quota: data.quota,
        };

        logger.debug('[useInitiateCall] ✓ Call initiated successfully:', {
          callId: callSession.id,
          roomUrl: callSession.roomUrl,
          token: callSession.token,
          roomReused: callSession.roomReused,
        });

        return callSession;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        logger.error('[useInitiateCall] ✗ Exception:', errorMsg);
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getToken]
  );

  return {
    initiateCall,
    loading,
    error,
  };
};

