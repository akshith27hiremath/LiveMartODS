import { Request, Response } from 'express';
import User from '../models/User.model';
import { logger } from '../utils/logger';

/**
 * User Controller
 * Handles user profile and account management
 */

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
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
    logger.error('❌ Get profile controller error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile',
    });
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const userId = req.user._id;
    const updates = req.body;

    // Don't allow updating certain fields
    delete updates.email;
    delete updates.password;
    delete updates.userType;
    delete updates.isActive;
    delete updates.isVerified;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user,
      },
    });
  } catch (error: any) {
    logger.error('❌ Update profile controller error:', error);

    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update profile',
    });
  }
};

/**
 * Change password
 * PUT /api/users/password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    logger.error('❌ Change password controller error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password',
    });
  }
};

/**
 * Delete user account
 * DELETE /api/users/account
 */
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    // Soft delete - deactivate account
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    logger.error('❌ Delete account controller error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete account',
    });
  }
};

/**
 * Get user by ID (admin/public)
 * GET /api/users/:id
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password -email');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error: any) {
    logger.error('❌ Get user by ID controller error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user',
    });
  }
};

export default {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getUserById,
};
