import { ObjectId } from 'mongodb';
import { getDatabase } from '../database';
import { hashingService } from '../crypto/hashing';
import { jwtService } from '../crypto/jwt';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface User {
  _id?: string;
  email: string;
  name: string;
  passwordHash: string;
  googleId?: string;
  role: 'admin' | 'member';
  trustScore: number;
  deviceFingerprint?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Auth Service - Handles user authentication and authorization
 */
export class AuthService {
  /**
   * Register new user
   */
  static async register(
    email: string,
    name: string,
    password: string,
    googleId?: string
  ): Promise<{ id: string; email: string; name: string }> {
    const db = getDatabase();

    // Check if user exists
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await hashingService.hashPassword(password);

    // Create user
    const user: User = {
      _id: new ObjectId().toString(),
      email,
      name,
      passwordHash,
      googleId,
      role: 'member',
      trustScore: config.DTSS_INIT_SCORE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').insertOne(user);

    logger.info(`User registered: ${email}`);

    return {
      id: user._id!,
      email: user.email,
      name: user.name,
    };
  }

  /**
   * Authenticate user and return tokens
   */
  static async login(
    email: string,
    password: string,
    deviceFingerprint: string = ''
  ): Promise<{
    userId: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    trustScore: number;
  }> {
    const db = getDatabase();

    const user = await db.collection<User>('users').findOne({ email });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await hashingService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Create tokens
    const accessToken = jwtService.createAccessToken({
      sub: user._id!,
      email: user.email,
      trustScore: user.trustScore || config.DTSS_INIT_SCORE,
    });

    const refreshToken = jwtService.createRefreshToken({
      sub: user._id!,
      email: user.email,
    });

    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: new Date(),
          deviceFingerprint: deviceFingerprint || user.deviceFingerprint,
          updatedAt: new Date(),
        },
      }
    );

    logger.info(`User logged in: ${email}`);

    return {
      userId: user._id!,
      email: user.email,
      name: user.name,
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      trustScore: user.trustScore || config.DTSS_INIT_SCORE,
    };
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): any | null {
    return jwtService.verifyToken(token);
  }

  /**
   * Generate new access token from refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    tokenType: string;
  }> {
    const payload = jwtService.verifyToken(refreshToken);

    if (!payload || payload.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    const userId = payload.sub;
    const db = getDatabase();
    const user = await db.collection<User>('users').findOne({ _id: userId });

    if (!user) {
      throw new Error('User not found');
    }

    const newAccessToken = jwtService.createAccessToken({
      sub: user._id!,
      email: user.email,
      trustScore: user.trustScore || config.DTSS_INIT_SCORE,
    });

    return {
      accessToken: newAccessToken,
      tokenType: 'Bearer',
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const db = getDatabase();
    return await db.collection<User>('users').findOne({ _id: userId });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const db = getDatabase();
    return await db.collection<User>('users').findOne({ email });
  }

  /**
   * Update user trust score
   */
  static async updateTrustScore(userId: string, trustScore: number): Promise<void> {
    const db = getDatabase();
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          trustScore: Math.max(0, Math.min(100, trustScore)),
          updatedAt: new Date(),
        },
      }
    );
  }
}

export const authService = AuthService;
