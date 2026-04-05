import { SecretsHelper } from './secrets-helper';
import { AppSecretKeys } from '../enum/secrets';

export interface AuthContext {
  userId: string;
  sessionId?: string;
}

export class ClerkLambdaAuth {
  private static cachedPublicKey: string | null = null;
  private static publicKeyExpiry: number = 0;

  static async verifyToken(authHeader: string | undefined): Promise<AuthContext> {
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      throw new Error('Token not found in authorization header');
    }

    try {
      const secretKey = await SecretsHelper.getSecretValue(AppSecretKeys.CLERK_SECRET_KEY);

      const decoded = await this.verifyJwt(token, secretKey);

      if (!decoded.sub) {
        throw new Error('User ID (sub) not found in token');
      }

      return {
        userId: decoded.sub,
        sessionId: decoded.sid,
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Invalid token'}`);
    }
  }

  private static async verifyJwt(token: string, secret: string): Promise<any> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;

    const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64').toString());

    if (!payload.iat || !payload.exp) {
      throw new Error('Token missing required claims');
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token has expired');
    }

    return payload;
  }
}
