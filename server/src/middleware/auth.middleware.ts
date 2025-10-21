import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/jwt.service';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

/**
 * Auth Middleware
 * Verifies JWT tokens and attaches user to request
 */

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

/**
 * Authenticate middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Please authenticate.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    const isBlacklisted = await jwtService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token has been revoked. Please login again.',
      });
      return;
    }

    // Verify token
    let payload;
    try {
      payload = jwtService.verifyAccessToken(token);
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid or expired token',
      });
      return;
    }

    // Get user from database
    const user = await authService.getUserById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
      return;
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;

    next();
  } catch (error: any) {
    logger.error('❌ Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

/**
 * Optional authenticate middleware
 * Attaches user if token is valid, but doesn't fail if not
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without user
      return next();
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await jwtService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return next();
    }

    // Verify token
    try {
      const payload = jwtService.verifyAccessToken(token);
      const user = await authService.getUserById(payload.userId);

      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    } catch (error) {
      // Invalid token, but don't fail - just continue without user
    }

    next();
  } catch (error: any) {
    logger.error('❌ Optional authentication error:', error);
    next(); // Continue even if error
  }
};

export default authenticate;
