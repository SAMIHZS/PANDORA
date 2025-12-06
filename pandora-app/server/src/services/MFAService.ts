import { ObjectId } from 'mongodb';
import { getDatabase } from '../database';
import { config } from '../config';
import { logger } from '../utils/logger';
import { auditService } from './AuditService';

export interface MFAOTP {
  _id?: string;
  userId: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
  verified: boolean;
}

/**
 * MFA Service - Multi-Factor Authentication service
 * Handles OTP generation and verification
 */
export class MFAService {
  /**
   * Generate 6-digit OTP
   */
  static async generateOTP(userId: string): Promise<string> {
    const db = getDatabase();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.MFA_OTP_EXPIRE_MINUTES);

    // Store OTP
    const otpDoc: MFAOTP = {
      _id: new ObjectId().toString(),
      userId,
      code: otp,
      expiresAt,
      createdAt: new Date(),
      verified: false,
    };

    await db.collection('mfa_otps').insertOne(otpDoc);

    logger.info(`OTP generated for user ${userId}: ${otp}`);
    return otp;
  }

  /**
   * Send OTP via email (or console for demo)
   */
  static async sendOTP(userEmail: string, userId: string): Promise<void> {
    const otp = await this.generateOTP(userId);

    // For hackathon, print to console instead of real email
    logger.warn(`📧 MFA OTP for ${userEmail}: ${otp}`);

    // TODO: Uncomment for real email:
    // const { sendEmail } = require('../utils/email');
    // const subject = 'PANDORA - Your One-Time Password';
    // const body = `Your OTP is: ${otp}\nValid for ${config.MFA_OTP_EXPIRE_MINUTES} minutes.`;
    // await sendEmail(userEmail, subject, body);

    await auditService.logAction(userId, null, 'mfa_otp_sent', {
      email: userEmail,
    });
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(userId: string, code: string): Promise<boolean> {
    const db = getDatabase();

    const otpDoc = await db.collection<MFAOTP>('mfa_otps').findOne({
      userId,
      code,
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!otpDoc) {
      logger.warn(`Invalid OTP for user ${userId}`);
      await auditService.logAction(userId, null, 'mfa_otp_failed', {
        code,
      });
      return false;
    }

    // Mark as verified
    await db.collection('mfa_otps').updateOne(
      { _id: otpDoc._id },
      {
        $set: { verified: true },
      }
    );

    logger.info(`OTP verified for user ${userId}`);
    await auditService.logAction(userId, null, 'mfa_otp_verified', {
      code,
    });

    return true;
  }

  /**
   * Check if user has valid unverified OTP
   */
  static async hasValidOTP(userId: string): Promise<boolean> {
    const db = getDatabase();

    const otpDoc = await db.collection<MFAOTP>('mfa_otps').findOne({
      userId,
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    return !!otpDoc;
  }

  /**
   * Clean up expired OTPs (can be called periodically)
   */
  static async cleanupExpiredOTPs(): Promise<void> {
    const db = getDatabase();

    const result = await db.collection('mfa_otps').deleteMany({
      expiresAt: { $lt: new Date() },
    });

    logger.debug(`Cleaned up ${result.deletedCount} expired OTPs`);
  }
}

export const mfaService = MFAService;
