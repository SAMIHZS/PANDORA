import { ObjectId } from 'mongodb';
import { getDatabase } from '../database';
import { logger } from '../utils/logger';
import { workspaceService } from './WorkspaceService';
import { auditService } from './AuditService';

export interface Message {
  _id?: string;
  workspaceId: string;
  senderId: string;
  encryptedContent: string;
  nonce: string;
  createdAt: Date;
}

/**
 * Message Service - Handles E2EE messaging
 * Messages are encrypted on the client side before sending
 */
export class MessageService {
  /**
   * Send encrypted message
   */
  static async sendMessage(
    workspaceId: string,
    senderId: string,
    encryptedContent: string,
    nonce: string
  ): Promise<{
    id: string;
    createdAt: Date;
  }> {
    const db = getDatabase();

    // Verify user has access to workspace
    const member = await db.collection('workspace_members').findOne({
      userId: senderId,
      workspaceId,
      status: 'active',
    });

    if (!member) {
      throw new Error('Not authorized to send messages in this workspace');
    }

    // Check access level
    if (member.accessLevel === 'blocked') {
      throw new Error('Access blocked due to low trust score');
    }

    const message: Message = {
      _id: new ObjectId().toString(),
      workspaceId,
      senderId,
      encryptedContent,
      nonce,
      createdAt: new Date(),
    };

    await db.collection('messages').insertOne(message);

    logger.info(`Message sent by ${senderId} in workspace ${workspaceId}`);

    await auditService.logAction(senderId, workspaceId, 'message_sent', {
      messageId: message._id,
    });

    return {
      id: message._id!,
      createdAt: message.createdAt,
    };
  }

  /**
   * Get workspace messages
   */
  static async getMessages(
    workspaceId: string,
    userId: string,
    limit: number = 50
  ): Promise<Array<Message & { senderName: string }>> {
    const db = getDatabase();

    // Verify user has access to workspace
    const member = await db.collection('workspace_members').findOne({
      userId,
      workspaceId,
      status: 'active',
    });

    if (!member) {
      throw new Error('Not authorized to view messages in this workspace');
    }

    // Get messages
    const messages = await db
      .collection<Message>('messages')
      .find({ workspaceId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Enrich with sender info
    const enrichedMessages = [];

    for (const msg of messages.reverse()) {
      const sender = await db.collection('users').findOne({ _id: msg.senderId });
      enrichedMessages.push({
        ...msg,
        id: msg._id,
        senderName: sender?.name || 'Unknown',
      });
    }

    return enrichedMessages;
  }

  /**
   * Delete message (only by sender or workspace owner)
   */
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    const db = getDatabase();

    const message = await db.collection<Message>('messages').findOne({ _id: messageId });

    if (!message) {
      throw new Error('Message not found');
    }

    // Check if user is sender or workspace owner
    const workspace = await db.collection('workspaces').findOne({ _id: message.workspaceId });
    const isOwner = workspace?.createdBy === userId;
    const isSender = message.senderId === userId;

    if (!isSender && !isOwner) {
      throw new Error('Not authorized to delete this message');
    }

    await db.collection('messages').deleteOne({ _id: messageId });

    logger.info(`Message ${messageId} deleted by ${userId}`);

    await auditService.logAction(userId, message.workspaceId, 'message_deleted', {
      messageId,
    });
  }
}

export const messageService = MessageService;
