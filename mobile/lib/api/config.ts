// API Configuration
export const API_CONFIG = {
  // Base URL for the API - real backend endpoint (API Gateway)
  BASE_URL: process.env.EXPO_PUBLIC_BASE_URL || '',

  // Timeout for requests
  TIMEOUT: 10000,

  // Message posting - direct Lambda URL (bypasses API Gateway timeout)
  CHAT_URL: process.env.EXPO_PUBLIC_CHAT_URL || '',

  // Onboarding - direct Lambda URL (bypasses API Gateway 29s timeout for insights generation)
  ONBOARDING_URL: process.env.EXPO_PUBLIC_ONBOARDING_URL || process.env.EXPO_PUBLIC_BASE_URL || '',
};

// API Response wrapper types
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Type guards for response handling
export const isApiSuccess = <T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> => {
  return response.success === true;
};

export const isApiError = <T>(response: ApiResponse<T>): response is ApiErrorResponse => {
  return response.success === false;
};

// Common API error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request configuration
export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
}

// Pagination parameters
export interface PaginationParams {
  offset?: number;
  limit?: number;
  page?: number;
}

// Common response metadata
export interface ResponseMetadata {
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}
