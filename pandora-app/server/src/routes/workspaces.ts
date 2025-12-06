import { Router, Response } from 'express';
import { workspaceService } from '../services/WorkspaceService';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/workspaces
 * Create new workspace
 */
router.post('/', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const result = await workspaceService.createWorkspace(req.userId!, name);

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create workspace' });
  }
});

/**
 * GET /api/workspaces
 * Get user's workspaces
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaces = await workspaceService.getUserWorkspaces(req.userId!);

    res.json({ workspaces });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get workspaces' });
  }
});

/**
 * GET /api/workspaces/:id
 * Get workspace details
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json(workspace);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get workspace' });
  }
});

/**
 * GET /api/workspaces/:id/key
 * Get workspace encryption key (for client-side encryption)
 */
router.get('/:id/key', async (req: AuthRequest, res: Response) => {
  try {
    const key = await workspaceService.getWorkspaceKey(req.params.id, req.userId!);

    res.json({ encryptionKey: key });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Failed to get workspace key' });
  }
});

/**
 * POST /api/workspaces/:id/invites
 * Generate join invite
 */
router.post('/:id/invites', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const result = await workspaceService.generateJoinInvite(req.params.id, req.userId!);

    res.json(result);
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Failed to generate invite' });
  }
});

/**
 * POST /api/workspaces/join/:token
 * Join workspace via invite
 */
router.post('/join/:token', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = await workspaceService.consumeJoinInvite(req.params.token, req.userId!);

    res.json({
      message: 'Joined workspace (pending admin approval)',
      workspaceId,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to join workspace' });
  }
});

/**
 * GET /api/workspaces/:id/pending
 * Get pending members (admin only)
 */
router.get('/:id/pending', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const pending = await workspaceService.getPendingMembers(req.params.id, req.userId!);

    res.json({ pendingMembers: pending });
  } catch (error: any) {
    res.status(403).json({ error: error.message || 'Failed to get pending members' });
  }
});

/**
 * POST /api/workspaces/:id/members/:userId/approve
 * Approve pending member
 */
router.post(
  '/:id/members/:userId/approve',
  requireRole(['admin']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { role } = req.body;

      await workspaceService.approveMember(
        req.params.id,
        req.params.userId,
        req.userId!,
        role || 'editor'
      );

      res.json({ message: 'Member approved' });
    } catch (error: any) {
      res.status(403).json({ error: error.message || 'Failed to approve member' });
    }
  }
);

export default router;
