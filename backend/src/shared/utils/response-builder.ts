import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
  cached?: boolean;
}

/**
 * Hono response body interface
 */
export interface HonoResponseBody<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  cached?: boolean;
}

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Allowed origins for CORS, parsed once at module load from the
 * `ALLOWED_ORIGINS` environment variable (comma-separated). If unset, no
 * `Access-Control-Allow-Origin` header is emitted and the browser will block
 * cross-origin calls — failing closed by design.
 *
 * NOTE: For Lambdas to see this env var at runtime, each Lambda definition
 * in the service stacks must include `ALLOWED_ORIGINS` in its `environment`
 * block. This wiring is a follow-up step and is not yet complete across all
 * stacks — audit and finish before the first production deploy. See README.
 */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/**
 * The canonical allowed origin to echo back on responses. Exported so that
 * handlers which build their own header objects (e.g. bespoke call handlers)
 * can reference the same env-driven value instead of hardcoding `'*'`.
 * Empty string when unset — browsers will block cross-origin calls.
 */
export const CORS_ALLOWED_ORIGIN = ALLOWED_ORIGINS[0] ?? '';

/**
 * CORS headers for API responses. Uses the first allowed origin as the
 * single static value returned on every response. For multi-origin setups,
 * callers should override `Access-Control-Allow-Origin` per-request via
 * `additionalHeaders` after validating the request's `Origin` header against
 * `ALLOWED_ORIGINS`.
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0] ?? '',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key',
  'Access-Control-Max-Age': '86400',
};

/**
 * Standard headers for all responses
 */
const STANDARD_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  ...CORS_HEADERS,
};

/**
 * Build a standardized API Gateway response
 */
export function buildResponse<T = any>(
  statusCode: number,
  data?: T,
  message?: string,
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  const isSuccess = statusCode >= 200 && statusCode < 300;
  
  const response: ApiResponse<T> = {
    success: isSuccess,
    timestamp: new Date().toISOString(),
  };

  if (isSuccess) {
    response.data = data;
    if (message) {
      response.message = message;
    }
  } else {
    // For error responses, treat data as error message if it's a string
    if (typeof data === 'string') {
      response.error = data;
    } else if (data && typeof data === 'object' && 'error' in data) {
      response.error = (data as any).error;
    } else {
      response.error = message || 'An error occurred';
    }
  }

  return {
    statusCode,
    headers: {
      ...STANDARD_HEADERS,
      ...additionalHeaders,
    },
    body: JSON.stringify(response, null, 2),
  };
}

/**
 * Build a success response (200)
 */
export function buildSuccessResponse<T = any>(
  data?: T,
  message?: string,
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  return buildResponse(HTTP_STATUS.OK, data, message, additionalHeaders);
}

/**
 * Build a created response (201)
 */
export function buildCreatedResponse<T = any>(
  data?: T,
  message?: string,
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  return buildResponse(HTTP_STATUS.CREATED, data, message, additionalHeaders);
}

/**
 * Build a bad request response (400)
 */
export function buildBadRequestResponse(
  error: string,
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  return buildResponse(HTTP_STATUS.BAD_REQUEST, { error }, undefined, additionalHeaders);
}

/**
 * Build an unauthorized response (401)
 */
export function buildUnauthorizedResponse(
  error: string = 'Unauthorized',
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  return buildResponse(HTTP_STATUS.UNAUTHORIZED, { error }, undefined, additionalHeaders);
}

/**
 * Build a forbidden response (403)
 */
export function buildForbiddenResponse(
  error: string = 'Forbidden',
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  return buildResponse(HTTP_STATUS.FORBIDDEN, { error }, undefined, additionalHeaders);
}

/**
 * Build a not found response (404)
 */
export function buildNotFoundResponse(
  error: string = 'Resource not found',
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  return buildResponse(HTTP_STATUS.NOT_FOUND, { error }, undefined, additionalHeaders);
}

/**
 * Build a conflict response (409)
 */
export function buildConflictResponse(
  error: string,
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  return buildResponse(HTTP_STATUS.CONFLICT, { error }, undefined, additionalHeaders);
}

/**
 * Build an internal server error response (500)
 */
export function buildInternalServerErrorResponse(
  error: string = 'Internal server error',
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  return buildResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, { error }, undefined, additionalHeaders);
}

/**
 * Build a validation error response (422)
 */
export function buildValidationErrorResponse(
  errors: string[] | string,
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors;
  return buildResponse(
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    { error: errorMessage, validationErrors: Array.isArray(errors) ? errors : [errors] },
    undefined,
    additionalHeaders
  );
}

/**
 * Build a rate limit response (429)
 */
export function buildRateLimitResponse(
  retryAfter?: number,
  additionalHeaders?: Record<string, string>
): APIGatewayProxyResult {
  const headers = retryAfter
    ? { 'Retry-After': retryAfter.toString(), ...additionalHeaders }
    : additionalHeaders;

  return buildResponse(
    HTTP_STATUS.TOO_MANY_REQUESTS,
    { error: 'Too many requests' },
    undefined,
    headers
  );
}

/**
 * Build OPTIONS response for CORS preflight
 */
export function buildOptionsResponse(): APIGatewayProxyResult {
  return {
    statusCode: HTTP_STATUS.OK,
    headers: CORS_HEADERS,
    body: '',
  };
}

/**
 * Handle errors and build appropriate response
 */
export function buildErrorResponse(error: any): APIGatewayProxyResult {
  console.error('API Error:', error);

  // Handle known error types
  if (error.name === 'ValidationError') {
    return buildValidationErrorResponse(error.message);
  }

  if (error.name === 'NotFoundError') {
    return buildNotFoundResponse(error.message);
  }

  if (error.name === 'UnauthorizedError') {
    return buildUnauthorizedResponse(error.message);
  }

  if (error.name === 'ForbiddenError') {
    return buildForbiddenResponse(error.message);
  }

  if (error.name === 'ConflictError') {
    return buildConflictResponse(error.message);
  }

  // Handle AWS SDK errors
  if (error.name === 'ResourceNotFoundException') {
    return buildNotFoundResponse('Resource not found');
  }

  if (error.name === 'AccessDeniedException') {
    return buildForbiddenResponse('Access denied');
  }

  if (error.name === 'ThrottlingException' || error.name === 'TooManyRequestsException') {
    return buildRateLimitResponse();
  }

  // Default to internal server error
  return buildInternalServerErrorResponse(
    process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  );
}

/**
 * Middleware to wrap Lambda handlers with standard error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<APIGatewayProxyResult>
) {
  return async (...args: T): Promise<APIGatewayProxyResult> => {
    try {
      return await handler(...args);
    } catch (error) {
      return buildErrorResponse(error);
    }
  };
}

/**
 * Extract request ID from Lambda context for tracing
 */
export function addRequestId(requestId: string) {
  return (response: APIGatewayProxyResult): APIGatewayProxyResult => {
    const body = JSON.parse(response.body);
    body.requestId = requestId;

    return {
      ...response,
      headers: {
        ...response.headers,
        'X-Request-ID': requestId,
      },
      body: JSON.stringify(body, null, 2),
    };
  };
}

// ============================================
// HONO.JS RESPONSE BUILDERS
// ============================================

/**
 * Build a success response for Hono (200)
 */
export function buildHonoSuccess<T = any>(
  c: any,
  data?: T,
  message?: string,
  cached: boolean = false
) {
  const response: HonoResponseBody<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  if (cached) {
    response.cached = true;
  }

  return c.json(response, 200);
}

/**
 * Build a created response for Hono (201)
 */
export function buildHonoCreated<T = any>(
  c: any,
  data?: T,
  message?: string
) {
  const response: HonoResponseBody<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    message: message || 'Resource created successfully',
  };

  return c.json(response, 201);
}

/**
 * Build a bad request response for Hono (400)
 */
export function buildHonoBadRequest(
  c: any,
  error: string
) {
  const response: HonoResponseBody = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  return c.json(response, 400);
}

/**
 * Build an unauthorized response for Hono (401)
 */
export function buildHonoUnauthorized(
  c: any,
  error: string = 'Unauthorized'
) {
  const response: HonoResponseBody = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  return c.json(response, 401);
}

/**
 * Build a forbidden response for Hono (403)
 */
export function buildHonoForbidden(
  c: any,
  error: string = 'Forbidden'
) {
  const response: HonoResponseBody = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  return c.json(response, 403);
}

/**
 * Build a not found response for Hono (404)
 */
export function buildHonoNotFound(
  c: any,
  error: string = 'Resource not found'
) {
  const response: HonoResponseBody = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  return c.json(response, 404);
}

/**
 * Build a conflict response for Hono (409)
 */
export function buildHonoConflict(
  c: any,
  error: string
) {
  const response: HonoResponseBody = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  return c.json(response, 409);
}

/**
 * Build an internal server error response for Hono (500)
 */
export function buildHonoServerError(
  c: any,
  error: string = 'Internal server error'
) {
  const response: HonoResponseBody = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  return c.json(response, 500);
}

/**
 * Build a validation error response for Hono (422)
 */
export function buildHonoValidationError(
  c: any,
  errors: string[] | string
) {
  const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors;

  const response: HonoResponseBody = {
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
  };

  return c.json(response, 422);
}

/**
 * Build a rate limit response for Hono (429)
 */
export function buildHonoRateLimit(
  c: any,
  retryAfter?: number
) {
  const response: HonoResponseBody = {
    success: false,
    error: 'Too many requests',
    timestamp: new Date().toISOString(),
  };

  if (retryAfter) {
    c.header('Retry-After', retryAfter.toString());
  }

  return c.json(response, 429);
}

/**
 * Handle errors and build appropriate Hono response
 */
export function buildHonoErrorResponse(
  c: any,
  error: any
) {
  console.error('API Error:', error);

  // Handle known error types
  if (error.name === 'ValidationError') {
    return buildHonoValidationError(c, error.message);
  }

  if (error.name === 'NotFoundError') {
    return buildHonoNotFound(c, error.message);
  }

  if (error.name === 'UnauthorizedError') {
    return buildHonoUnauthorized(c, error.message);
  }

  if (error.name === 'ForbiddenError') {
    return buildHonoForbidden(c, error.message);
  }

  if (error.name === 'ConflictError') {
    return buildHonoConflict(c, error.message);
  }

  // Handle AWS SDK errors
  if (error.name === 'ResourceNotFoundException') {
    return buildHonoNotFound(c, 'Resource not found');
  }

  if (error.name === 'AccessDeniedException') {
    return buildHonoForbidden(c, 'Access denied');
  }

  if (error.name === 'ThrottlingException' || error.name === 'TooManyRequestsException') {
    return buildHonoRateLimit(c);
  }

  // Handle Hono HTTPException (check both name and presence of status property)
  if (error.name === 'HTTPException' || (error.status && typeof error.status === 'number')) {
    const response: HonoResponseBody = {
      success: false,
      error: error.message || 'An error occurred',
      timestamp: new Date().toISOString(),
    };
    return c.json(response, error.status || 500);
  }

  // Default to internal server error
  return buildHonoServerError(
    c,
    process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  );
}
