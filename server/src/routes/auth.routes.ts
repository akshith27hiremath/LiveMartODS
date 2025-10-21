import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateResetPassword,
} from '../middleware/validation.middleware';

/**
 * Auth Routes
 * Handles authentication endpoints
 */

const router = Router();

/**
 * Base route - Auth API info
 */
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Authentication API',
    endpoints: {
      public: [
        'POST /api/auth/register - Register new user',
        'POST /api/auth/login - Login user',
        'POST /api/auth/refresh - Refresh access token',
        'POST /api/auth/forgot-password - Request password reset',
        'POST /api/auth/reset-password - Reset password with token',
        'GET /api/auth/verify-email/:token - Verify email address',
        'GET /api/auth/google - Google OAuth',
        'GET /api/auth/facebook - Facebook OAuth',
      ],
      protected: [
        'GET /api/auth/me - Get current user',
        'POST /api/auth/logout - Logout user',
        'POST /api/auth/logout-all - Logout from all devices',
      ],
    },
  });
});

/**
 * Public Routes (no authentication required)
 */

// POST /api/auth/register - Register new user
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login - Login user
router.post('/login', validateLogin, authController.login);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', validateRefreshToken, authController.refreshToken);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// GET /api/auth/verify-email/:token - Verify email address
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * Protected Routes (authentication required)
 */

// GET /api/auth/me - Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// POST /api/auth/logout - Logout user
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/logout-all - Logout from all devices
router.post('/logout-all', authenticate, authController.logoutAll);

export default router;
