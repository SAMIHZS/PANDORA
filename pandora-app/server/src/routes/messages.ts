import { Router, Response } from 'express';
import { messageService } from '../services/MessageService';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/workspaces/:workspaceId/messages
 * Send encrypted message
 */
router.post('/:workspaceId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { content, nonce } = req.body;

    if (!content || !nonce) {
      return res.status(400).json({ error: 'Missing content or nonce' });
    }

    const result = await messageService.sendMessage(
      req.params.workspaceId,
      req.userId!,
      content,
      nonce
    );

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to send message' });
  }
});

/**
 * GET /api/workspaces/:workspaceId/messages
 * Get workspace messages
 */
router.get('/:workspaceId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await messageService.getMessages(
      req.params.workspaceId,
      req.userId!,
      limit
    );

    res.json({ messages });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to get messages' });
  }
});

/**
 * DELETE /api/workspaces/:workspaceId/messages/:messageId
 * Delete message
 */
router.delete('/:workspaceId/messages/:messageId', async (req: AuthRequest, res: Response) => {
  try {
    await messageService.deleteMessage(req.params.messageId, req.userId!);

    res.json({ message: 'Message deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete message' });
  }
});

export default router;
