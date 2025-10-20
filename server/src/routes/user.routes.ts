import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  validateUpdateProfile,
  validateChangePassword,
} from '../middleware/validation.middleware';

/**
 * User Routes
 * Handles user profile and account management
 */

const router = Router();

/**
 * All user routes require authentication
 */

// GET /api/users/profile - Get current user profile
router.get('/profile', authenticate, userController.getProfile);

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, validateUpdateProfile, userController.updateProfile);

// PUT /api/users/password - Change password
router.put('/password', authenticate, validateChangePassword, userController.changePassword);

// DELETE /api/users/account - Delete account (soft delete)
router.delete('/account', authenticate, userController.deleteAccount);

// GET /api/users/:id - Get user by ID (public info only)
router.get('/:id', userController.getUserById);

export default router;
