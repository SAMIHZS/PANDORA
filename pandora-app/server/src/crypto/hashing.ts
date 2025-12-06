import argon2 from 'argon2';
import { logger } from '../utils/logger';

/**
 * Hashing Service - Handles password hashing with Argon2
 * Argon2 is the winner of the Password Hashing Competition and provides
 * resistance against GPU cracking attacks and memory-hard computation.
 */
export class HashingService {
  /**
   * Hash password using Argon2
   * @param password - Plain text password
   * @returns Hashed password string
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      // Argon2id variant provides both memory-hard and time-hard properties
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3, // 3 iterations
        parallelism: 4, // 4 threads
      });
    } catch (error) {
      logger.error(`Error hashing password: ${error}`);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify password against hash
   * @param password - Plain text password
   * @param hash - Hashed password string
   * @returns True if password matches, false otherwise
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      logger.error(`Error verifying password: ${error}`);
      return false;
    }
  }
}

export const hashingService = HashingService;
