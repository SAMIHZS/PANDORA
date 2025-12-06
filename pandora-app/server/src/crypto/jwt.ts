import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * JWT Service - Handles JWT token generation and validation
 * Implements short-lived access tokens (15 min) and long-lived refresh tokens (7 days)
 */
export class JWTService {
  /**
   * Create short-lived access token
   * @param data - Payload data (userId, email, trustScore, etc.)
   * @param expiresInMinutes - Optional custom expiration time in minutes
   * @returns JWT access token string
   */
  static createAccessToken(data: { sub: string; email?: string; trustScore?: number; workspaceId?: string }, expiresInMinutes?: number): string {
    const expiresIn = expiresInMinutes || config.ACCESS_TOKEN_EXPIRE_MINUTES;

    const payload = {
      ...data,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, config.SECRET_KEY, {
      algorithm: config.ALGORITHM as jwt.Algorithm,
      expiresIn: `${expiresIn}m`,
    });
  }

  /**
   * Create long-lived refresh token
   * @param data - Payload data (userId, email)
   * @returns JWT refresh token string
   */
  static createRefreshToken(data: { sub: string; email?: string }): string {
    const payload = {
      ...data,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, config.SECRET_KEY, {
      algorithm: config.ALGORITHM as jwt.Algorithm,
      expiresIn: `${config.REFRESH_TOKEN_EXPIRE_DAYS}d`,
    });
  }

  /**
   * Verify and decode token
   * @param token - JWT token string
   * @returns Decoded payload or null if invalid
   */
  static verifyToken(token: string): any | null {
    try {
      const decoded = jwt.verify(token, config.SECRET_KEY, {
        algorithms: [config.ALGORITHM as jwt.Algorithm],
      });
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.debug(`Token verification failed: ${error.message}`);
      } else {
        logger.error(`Token verification error: ${error}`);
      }
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param token - JWT token string
   * @returns Decoded payload or null
   */
  static decodeToken(token: string): any | null {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error(`Token decode error: ${error}`);
      return null;
    }
  }
}

export const jwtService = JWTService;
