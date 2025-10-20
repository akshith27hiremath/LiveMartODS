import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

/**
 * Auth Controller
 * Handles authentication-related requests
 */

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, tokens } = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        tokens,
      },
    });
  } catch (error: any) {
    logger.error('❌ Registration controller error:', error);

    const statusCode = error.message.includes('already exists') ? 409 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, tokens } = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        tokens,
      },
    });
  } catch (error: any) {
    logger.error('❌ Login controller error:', error);

    const statusCode = error.message.includes('deactivated') ? 403 : 401;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens,
      },
    });
  } catch (error: any) {
    logger.error('❌ Refresh token controller error:', error);

    res.status(401).json({
      success: false,
      message: error.message || 'Token refresh failed',
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.token) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    await authService.logout(req.user._id.toString(), req.token);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    logger.error('❌ Logout controller error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Logout failed',
    });
  }
};

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    await authService.logoutAll(req.user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (error: any) {
    logger.error('❌ Logout all controller error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Logout from all devices failed',
    });
  }
};

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error: any) {
    logger.error('❌ Get current user controller error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user info',
    });
  }
};

/**
 * Verify email (placeholder)
 * GET /api/auth/verify-email/:token
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    await authService.verifyEmail(token);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    logger.error('❌ Email verification controller error:', error);

    res.status(400).json({
      success: false,
      message: error.message || 'Email verification failed',
    });
  }
};

/**
 * Request password reset (placeholder)
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error: any) {
    logger.error('❌ Forgot password controller error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send password reset email',
    });
  }
};

/**
 * Reset password (placeholder)
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    logger.error('❌ Reset password controller error:', error);

    res.status(400).json({
      success: false,
      message: error.message || 'Password reset failed',
    });
  }
};

export default {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
