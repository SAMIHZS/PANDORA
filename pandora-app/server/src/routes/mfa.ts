import { Router, Response } from 'express';
import { mfaService } from '../services/MFAService';
import { authService } from '../services/AuthService';
import { dtssService } from '../services/DTSSService';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/mfa/challenge
 * Request MFA OTP
 */
router.post('/challenge', async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getUserById(req.userId!);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await mfaService.sendOTP(user.email, req.userId!);

    res.json({ message: 'OTP sent to email' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
});

/**
 * POST /api/mfa/verify
 * Verify MFA OTP
 */
router.post('/verify', async (req: AuthRequest, res: Response) => {
  try {
    const { code, workspaceId } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'OTP code is required' });
    }

    const isValid = await mfaService.verifyOTP(req.userId!, code);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // If workspaceId provided, reward MFA success for that workspace
    if (workspaceId) {
      await dtssService.rewardMFASuccess(req.userId!, workspaceId);
    }

    res.json({ message: 'MFA verified successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to verify OTP' });
  }
});

export default router;
