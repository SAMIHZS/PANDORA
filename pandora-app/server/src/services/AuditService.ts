import { ObjectId } from 'mongodb';
import { getDatabase } from '../database';
import { logger } from '../utils/logger';

export interface AuditLog {
  _id?: string;
  userId: string;
  workspaceId: string | null;
  action: string;
  targetId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

/**
 * Audit Service - Comprehensive logging of all user actions
 * Immutable audit trail for compliance and security monitoring
 */
export class AuditService {
  /**
   * Log user action
   */
  static async logAction(
    userId: string,
    workspaceId: string | null,
    action: string,
    metadata: Record<string, any> = {},
    targetId?: string
  ): Promise<void> {
    const db = getDatabase();

    const logEntry: AuditLog = {
      _id: new ObjectId().toString(),
      userId,
      workspaceId,
      action,
      targetId,
      metadata,
      createdAt: new Date(),
    };

    await db.collection('audit_logs').insertOne(logEntry);

    logger.debug(`Audit log: ${action} by ${userId} in ${workspaceId || 'global'}`);
  }

  /**
   * Get audit logs for workspace
   */
  static async getWorkspaceLogs(
    workspaceId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Array<AuditLog & { userEmail: string; userName: string }>> {
    const db = getDatabase();

    const logs = await db
      .collection<AuditLog>('audit_logs')
      .find({ workspaceId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Enrich with user info
    const enrichedLogs = [];

    for (const log of logs) {
      const user = await db.collection('users').findOne({ _id: log.userId });
      enrichedLogs.push({
        ...log,
        id: log._id,
        userEmail: user?.email || 'Unknown',
        userName: user?.name || 'Unknown',
      });
    }

    return enrichedLogs;
  }

  /**
   * Get audit logs for user
   */
  static async getUserLogs(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Array<AuditLog>> {
    const db = getDatabase();

    const logs = await db
      .collection<AuditLog>('audit_logs')
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return logs.map((log) => ({
      ...log,
      id: log._id,
    }));
  }

  /**
   * Get audit logs by action type
   */
  static async getLogsByAction(
    action: string,
    workspaceId?: string,
    limit: number = 100
  ): Promise<Array<AuditLog & { userEmail: string; userName: string }>> {
    const db = getDatabase();

    const query: any = { action };
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    const logs = await db
      .collection<AuditLog>('audit_logs')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Enrich with user info
    const enrichedLogs = [];

    for (const log of logs) {
      const user = await db.collection('users').findOne({ _id: log.userId });
      enrichedLogs.push({
        ...log,
        id: log._id,
        userEmail: user?.email || 'Unknown',
        userName: user?.name || 'Unknown',
      });
    }

    return enrichedLogs;
  }

  /**
   * Get audit logs with date range
   */
  static async getLogsByDateRange(
    startDate: Date,
    endDate: Date,
    workspaceId?: string,
    limit: number = 100
  ): Promise<Array<AuditLog & { userEmail: string; userName: string }>> {
    const db = getDatabase();

    const query: any = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    const logs = await db
      .collection<AuditLog>('audit_logs')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Enrich with user info
    const enrichedLogs = [];

    for (const log of logs) {
      const user = await db.collection('users').findOne({ _id: log.userId });
      enrichedLogs.push({
        ...log,
        id: log._id,
        userEmail: user?.email || 'Unknown',
        userName: user?.name || 'Unknown',
      });
    }

    return enrichedLogs;
  }
}

export const auditService = AuditService;
