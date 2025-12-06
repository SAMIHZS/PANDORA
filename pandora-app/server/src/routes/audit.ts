import { Router, Response } from 'express';
import { auditService } from '../services/AuditService';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/audit
 * Get audit logs (admin only)
 */
router.get('/', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId, action, limit, offset, startDate, endDate } = req.query;

    let logs;

    if (action) {
      logs = await auditService.getLogsByAction(
        action as string,
        workspaceId as string | undefined,
        parseInt(limit as string) || 100
      );
    } else if (startDate && endDate) {
      logs = await auditService.getLogsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string),
        workspaceId as string | undefined,
        parseInt(limit as string) || 100
      );
    } else if (workspaceId) {
      logs = await auditService.getWorkspaceLogs(
        workspaceId as string,
        parseInt(limit as string) || 100,
        parseInt(offset as string) || 0
      );
    } else {
      logs = await auditService.getUserLogs(
        req.userId!,
        parseInt(limit as string) || 100,
        parseInt(offset as string) || 0
      );
    }

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get audit logs' });
  }
});

/**
 * GET /api/audit/workspace/:workspaceId
 * Get workspace audit logs
 */
router.get('/workspace/:workspaceId', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await auditService.getWorkspaceLogs(req.params.workspaceId, limit, offset);

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get audit logs' });
  }
});

export default router;
