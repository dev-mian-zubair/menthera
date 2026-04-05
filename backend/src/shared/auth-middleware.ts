import { MiddlewareHandler } from 'hono';
import { clerkMiddleware } from '@hono/clerk-auth';
import { SecretsHelper } from './utils/secrets-helper';
import { AppSecretKeys } from './enum/secrets';

export const customClerkMiddleware: MiddlewareHandler = async (c, next) => {
  const publishableKey = await SecretsHelper.getSecretValue(AppSecretKeys.CLERK_PUBLISHABLE_KEY);
  const secretKey = await SecretsHelper.getSecretValue(AppSecretKeys.CLERK_SECRET_KEY);
  return clerkMiddleware({
    publishableKey,
    secretKey,
  })(c, next);
};

export default customClerkMiddleware;
