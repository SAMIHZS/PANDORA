import { ObjectId } from 'mongodb';
import { getDatabase } from '../database';
import { config } from '../config';
import { logger } from '../utils/logger';

export enum TrustEventType {
  FAILED_LOGIN = 'failed_login',
  NEW_DEVICE = 'new_device',
  NEW_COUNTRY = 'new_country',
  MFA_SUCCESS = 'mfa_success',
  ADMIN_APPROVAL = 'admin_approval',
  CLEAN_WEEK = 'clean_week',
}

export interface TrustEvent {
  _id?: ObjectId;
  userId: string;
  workspaceId: string;
  eventType: TrustEventType;
  pointChange: number;
  reason: string;
  createdAt: Date;
}

/**
 * DTSS Service - Dynamic Trust Score System
 * Adaptive security based on user behavior and risk signals
 */
export class DTSSService {
  /**
   * Get current trust score for user in workspace
   */
  static async getTrustScore(userId: string, workspaceId: string): Promise<number> {
    const db = getDatabase();
    const member = await db.collection('workspace_members').findOne({
      userId,
      workspaceId,
    });

    if (member) {
      return member.trustScore || config.DTSS_INIT_SCORE;
    }

    return config.DTSS_INIT_SCORE;
  }

  /**
   * Determine access level based on trust score
   */
  static getAccessLevel(trustScore: number): 'full' | 'viewOnly' | 'blocked' {
    if (trustScore >= config.DTSS_THRESHOLD_FULL) {
      return 'full';
    } else if (trustScore >= config.DTSS_THRESHOLD_MEDIUM) {
      return 'viewOnly'; // View-only + MFA required
    } else {
      return 'blocked';
    }
  }

  /**
   * Record a trust event and update score
   */
  static async recordTrustEvent(
    userId: string,
    workspaceId: string,
    eventType: TrustEventType,
    pointChange: number,
    reason: string = ''
  ): Promise<void> {
    const db = getDatabase();

    // Create event
    const event: TrustEvent = {
      _id: new ObjectId(),
      userId,
      workspaceId,
      eventType,
      pointChange,
      reason,
      createdAt: new Date(),
    };

    await db.collection('trust_events').insertOne(event);

    // Recalculate and update trust score
    const newScore = await this.calculateTrustScore(userId, workspaceId);

    await db.collection('workspace_members').updateOne(
      { userId, workspaceId },
      {
        $set: {
          trustScore: newScore,
          accessLevel: this.getAccessLevel(newScore),
          lastTrustUpdate: new Date(),
        },
      }
    );

    logger.info(
      `Trust event recorded: ${userId} in ${workspaceId}: ${eventType} (${pointChange} pts) -> Score: ${newScore}`
    );
  }

  /**
   * Calculate trust score based on all trust events
   */
  static async calculateTrustScore(userId: string, workspaceId: string): Promise<number> {
    const db = getDatabase();

    const events = await db
      .collection<TrustEvent>('trust_events')
      .find({
        userId,
        workspaceId,
      })
      .toArray();

    const baseScore = config.DTSS_INIT_SCORE;
    const totalPoints = events.reduce((sum, event) => sum + event.pointChange, 0);

    const finalScore = Math.max(0, Math.min(100, baseScore + totalPoints));
    return Math.floor(finalScore);
  }

  /**
   * Penalize failed login attempts
   */
  static async penalizeFailedLogin(userId: string, workspaceId: string): Promise<void> {
    await this.recordTrustEvent(
      userId,
      workspaceId,
      TrustEventType.FAILED_LOGIN,
      -config.DTSS_FAILED_LOGIN_LOSS,
      'Failed login attempt'
    );
  }

  /**
   * Reward successful MFA
   */
  static async rewardMFASuccess(userId: string, workspaceId: string): Promise<void> {
    await this.recordTrustEvent(
      userId,
      workspaceId,
      TrustEventType.MFA_SUCCESS,
      config.DTSS_MFA_SUCCESS_GAIN,
      'Successful MFA verification'
    );
  }

  /**
   * Reward admin approval
   */
  static async rewardAdminApproval(userId: string, workspaceId: string): Promise<void> {
    await this.recordTrustEvent(
      userId,
      workspaceId,
      TrustEventType.ADMIN_APPROVAL,
      config.DTSS_ADMIN_APPROVAL_GAIN,
      'Admin approved membership'
    );
  }

  /**
   * Penalize login from new device
   */
  static async penalizeNewDevice(userId: string, workspaceId: string): Promise<void> {
    await this.recordTrustEvent(
      userId,
      workspaceId,
      TrustEventType.NEW_DEVICE,
      -config.DTSS_NEW_COUNTRY_LOSS,
      'Login from new/unknown device'
    );
  }

  /**
   * Penalize login from new country
   */
  static async penalizeNewCountry(userId: string, workspaceId: string): Promise<void> {
    await this.recordTrustEvent(
      userId,
      workspaceId,
      TrustEventType.NEW_COUNTRY,
      -config.DTSS_NEW_COUNTRY_LOSS,
      'Login from new country/IP location'
    );
  }

  /**
   * Get trust score response with access level
   */
  static async getTrustScoreResponse(
    userId: string,
    workspaceId: string
  ): Promise<{ trustScore: number; accessLevel: string; lastUpdated: Date }> {
    const db = getDatabase();
    const member = await db.collection('workspace_members').findOne({
      userId,
      workspaceId,
    });

    if (!member) {
      throw new Error('User not found in workspace');
    }

    return {
      trustScore: member.trustScore || config.DTSS_INIT_SCORE,
      accessLevel: this.getAccessLevel(member.trustScore || config.DTSS_INIT_SCORE),
      lastUpdated: member.lastTrustUpdate || new Date(),
    };
  }
}

export const dtssService = DTSSService;
