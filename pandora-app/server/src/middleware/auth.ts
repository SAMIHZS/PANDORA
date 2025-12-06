import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../crypto/jwt';
import { authService } from '../services/AuthService';
import { getDatabase } from '../database';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  trustScore?: number;
}

/**
 * Authentication middleware - Verifies JWT token and attaches user info to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip auth for public routes
    const publicRoutes = ['/api/auth/register', '/api/auth/login', '/health', '/'];
    if (publicRoutes.some((route) => req.path.startsWith(route))) {
      return next();
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = jwtService.verifyToken(token);
    if (!payload || payload.type !== 'access') {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach user info to request
    req.userId = payload.sub;
    req.userEmail = payload.email;
    req.trustScore = payload.trustScore;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional authentication - Doesn't fail if no token, but attaches user if token is valid
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = jwtService.verifyToken(token);

      if (payload && payload.type === 'access') {
        req.userId = payload.sub;
        req.userEmail = payload.email;
        req.trustScore = payload.trustScore;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

/**
 * Require specific role
 */
export const requireRole = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const db = getDatabase();
    const user = await db.collection('users').findOne({ _id: req.userId });

    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
