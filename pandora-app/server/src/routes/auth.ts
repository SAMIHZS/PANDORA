import { Router, Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { auditService } from '../services/AuditService';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await authService.register(email, name, password);

    await auditService.logAction(result.id, null, 'user_registered', {
      email,
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login user and return tokens
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const deviceFingerprint = req.headers['user-agent'] || req.ip || '';

    const result = await authService.login(email, password, deviceFingerprint);

    // Log login
    await auditService.logAction(result.userId, null, 'login', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Missing refresh token' });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Token refresh failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // In a real app, invalidate refresh token
    await auditService.logAction(req.userId!, null, 'logout', {});

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Logout failed' });
  }
});

/**
 * GET /api/auth/verify
 * Verify JWT token
 */
router.get('/verify', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({
    valid: true,
    userId: req.userId,
    email: req.userEmail,
    trustScore: req.trustScore,
  });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getUserById(req.userId!);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      trustScore: user.trustScore,
      lastLogin: user.lastLogin,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get user info' });
  }
});

export default router;
