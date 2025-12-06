import { ObjectId } from 'mongodb';
import { getDatabase } from '../database';
import { encryptionService } from '../crypto/encryption';
import { config } from '../config';
import { logger } from '../utils/logger';
import { dtssService } from './DTSSService';
import { auditService } from './AuditService';

export interface Workspace {
  _id?: string;
  name: string;
  createdBy: string;
  encryptionKey: string;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  _id?: string;
  userId: string;
  workspaceId: string;
  role: 'owner' | 'editor' | 'viewer';
  accessLevel: 'full' | 'viewOnly' | 'blocked';
  trustScore: number;
  status?: 'pending' | 'active';
  joinedAt: Date;
  approvedAt?: Date;
  lastTrustUpdate?: Date;
}

export interface JoinInvite {
  _id?: string;
  workspaceId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Workspace Service - Handles workspace management and member operations
 */
export class WorkspaceService {
  /**
   * Create new workspace by admin
   */
  static async createWorkspace(adminId: string, name: string): Promise<{
    id: string;
    name: string;
    createdAt: Date;
  }> {
    const db = getDatabase();

    // Generate workspace encryption key
    const workspaceKey = encryptionService.generateWorkspaceKey();

    const workspace: Workspace = {
      _id: new ObjectId().toString(),
      name,
      createdBy: adminId,
      encryptionKey: workspaceKey,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('workspaces').insertOne(workspace);

    // Add admin as owner
    const membership: WorkspaceMember = {
      _id: new ObjectId().toString(),
      userId: adminId,
      workspaceId: workspace._id!,
      role: 'owner',
      accessLevel: 'full',
      trustScore: 100, // Admin gets max trust score
      status: 'active',
      joinedAt: new Date(),
      approvedAt: new Date(),
    };

    await db.collection('workspace_members').insertOne(membership);

    logger.info(`Workspace created: ${name} by ${adminId}`);

    await auditService.logAction(adminId, workspace._id!, 'workspace_created', {
      workspaceName: name,
    });

    return {
      id: workspace._id!,
      name: workspace.name,
      createdAt: workspace.createdAt,
    };
  }

  /**
   * Generate one-time join invite link
   */
  static async generateJoinInvite(workspaceId: string, adminId: string): Promise<{
    joinUrl: string;
    token: string;
    expiresAt: Date;
  }> {
    const db = getDatabase();

    // Verify admin owns workspace
    const workspace = await db.collection<Workspace>('workspaces').findOne({ _id: workspaceId });
    if (!workspace || workspace.createdBy !== adminId) {
      throw new Error('Not authorized');
    }

    // Generate unique token
    const token = require('crypto').randomBytes(32).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + config.JOIN_INVITE_EXPIRE_HOURS);

    const invite: JoinInvite = {
      _id: new ObjectId().toString(),
      workspaceId,
      token,
      expiresAt,
      createdAt: new Date(),
    };

    await db.collection('join_invites').insertOne(invite);

    const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${token}`;

    logger.info(`Join invite generated for workspace ${workspaceId}`);

    await auditService.logAction(adminId, workspaceId, 'invite_generated', {
      token,
      expiresAt,
    });

    return {
      joinUrl,
      token,
      expiresAt,
    };
  }

  /**
   * Consume one-time join invite and add user to workspace
   */
  static async consumeJoinInvite(token: string, userId: string): Promise<string> {
    const db = getDatabase();

    // Find invite
    const invite = await db.collection<JoinInvite>('join_invites').findOne({ token });

    if (!invite) {
      throw new Error('Invalid invite token');
    }

    if (invite.expiresAt < new Date()) {
      throw new Error('Invite expired');
    }

    const workspaceId = invite.workspaceId;

    // Check if user already in workspace
    const existing = await db.collection('workspace_members').findOne({
      userId,
      workspaceId,
    });

    if (existing) {
      throw new Error('Already member');
    }

    // Add user as pending member (viewer until admin approves)
    const membership: WorkspaceMember = {
      _id: new ObjectId().toString(),
      userId,
      workspaceId,
      role: 'viewer',
      accessLevel: 'full',
      trustScore: config.DTSS_INIT_SCORE,
      status: 'pending', // Awaiting admin approval
      joinedAt: new Date(),
    };

    await db.collection('workspace_members').insertOne(membership);

    // Mark invite as used
    await db.collection('join_invites').deleteOne({ _id: invite._id });

    logger.info(`User ${userId} joined workspace ${workspaceId} (pending)`);

    await auditService.logAction(userId, workspaceId, 'workspace_joined', {
      token,
    });

    return workspaceId;
  }

  /**
   * Admin approves pending member and assigns role
   */
  static async approveMember(
    workspaceId: string,
    userId: string,
    adminId: string,
    role: 'editor' | 'viewer' = 'editor'
  ): Promise<void> {
    const db = getDatabase();

    // Verify admin owns workspace
    const workspace = await db.collection<Workspace>('workspaces').findOne({ _id: workspaceId });
    if (!workspace || workspace.createdBy !== adminId) {
      throw new Error('Not authorized');
    }

    // Update member
    await db.collection('workspace_members').updateOne(
      { userId, workspaceId },
      {
        $set: {
          status: 'active',
          role,
          approvedAt: new Date(),
        },
      }
    );

    // Record trust event
    await dtssService.rewardAdminApproval(userId, workspaceId);

    logger.info(`Member ${userId} approved in workspace ${workspaceId} as ${role}`);

    await auditService.logAction(adminId, workspaceId, 'member_approved', {
      userId,
      role,
    });
  }

  /**
   * Get all workspaces user belongs to
   */
  static async getUserWorkspaces(userId: string): Promise<Array<{
    id: string;
    name: string;
    role: string;
    accessLevel: string;
    trustScore: number;
    createdAt: Date;
    status?: string;
  }>> {
    const db = getDatabase();

    const memberships = await db
      .collection<WorkspaceMember>('workspace_members')
      .find({ userId })
      .toArray();

    const workspaces = [];

    for (const membership of memberships) {
      const workspace = await db.collection<Workspace>('workspaces').findOne({
        _id: membership.workspaceId,
      });

      if (workspace) {
        workspaces.push({
          id: workspace._id!,
          name: workspace.name,
          role: membership.role,
          accessLevel: membership.accessLevel,
          trustScore: membership.trustScore || config.DTSS_INIT_SCORE,
          createdAt: workspace.createdAt,
          status: membership.status,
        });
      }
    }

    return workspaces;
  }

  /**
   * Get workspace by ID
   */
  static async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    const db = getDatabase();
    return await db.collection<Workspace>('workspaces').findOne({ _id: workspaceId });
  }

  /**
   * Get workspace encryption key
   */
  static async getWorkspaceKey(workspaceId: string, userId: string): Promise<string> {
    const db = getDatabase();

    // Verify user is member
    const member = await db.collection('workspace_members').findOne({
      userId,
      workspaceId,
      status: 'active',
    });

    if (!member) {
      throw new Error('Not authorized to access workspace');
    }

    const workspace = await db.collection<Workspace>('workspaces').findOne({ _id: workspaceId });
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return workspace.encryptionKey;
  }

  /**
   * Get pending members for a workspace
   */
  static async getPendingMembers(workspaceId: string, adminId: string): Promise<Array<{
    userId: string;
    userEmail: string;
    userName: string;
    joinedAt: Date;
  }>> {
    const db = getDatabase();

    // Verify admin owns workspace
    const workspace = await db.collection<Workspace>('workspaces').findOne({ _id: workspaceId });
    if (!workspace || workspace.createdBy !== adminId) {
      throw new Error('Not authorized');
    }

    const pendingMembers = await db
      .collection<WorkspaceMember>('workspace_members')
      .find({
        workspaceId,
        status: 'pending',
      })
      .toArray();

    const result = [];

    for (const member of pendingMembers) {
      const user = await db.collection('users').findOne({ _id: member.userId });
      if (user) {
        result.push({
          userId: member.userId,
          userEmail: user.email,
          userName: user.name,
          joinedAt: member.joinedAt,
        });
      }
    }

    return result;
  }
}

export const workspaceService = WorkspaceService;
