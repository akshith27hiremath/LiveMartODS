import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * RBAC (Role-Based Access Control) Middleware
 * Controls access based on user roles
 */

type UserType = 'CUSTOMER' | 'RETAILER' | 'WHOLESALER';

/**
 * Require specific role(s) to access route
 */
export const requireRole = (allowedRoles: UserType | UserType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Normalize to array
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Check if user has required role
      if (!roles.includes(req.user.userType)) {
        logger.warn(
          `❌ Access denied for user ${req.user.email} (${req.user.userType}) to route requiring ${roles.join(' or ')}`
        );

        res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          required: roles,
          current: req.user.userType,
        });
        return;
      }

      // User has required role
      next();
    } catch (error: any) {
      logger.error('❌ RBAC error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message,
      });
    }
  };
};

/**
 * Require customer role
 */
export const requireCustomer = requireRole('CUSTOMER');

/**
 * Require retailer role
 */
export const requireRetailer = requireRole('RETAILER');

/**
 * Require wholesaler role
 */
export const requireWholesaler = requireRole('WHOLESALER');

/**
 * Require seller role (retailer or wholesaler)
 */
export const requireSeller = requireRole(['RETAILER', 'WHOLESALER']);

/**
 * Check if user owns the resource
 */
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Get resource user ID from params, body, or query
      const resourceUserId =
        req.params[resourceUserIdField] ||
        req.body[resourceUserIdField] ||
        req.query[resourceUserIdField];

      if (!resourceUserId) {
        res.status(400).json({
          success: false,
          message: `Missing ${resourceUserIdField} in request`,
        });
        return;
      }

      // Check if user owns the resource
      if (req.user._id.toString() !== resourceUserId.toString()) {
        logger.warn(
          `❌ Ownership check failed for user ${req.user.email} on resource with ${resourceUserIdField}=${resourceUserId}`
        );

        res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.',
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error('❌ Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Ownership check failed',
        error: error.message,
      });
    }
  };
};

/**
 * Check if user is verified (for retailers/wholesalers)
 */
export const requireVerified = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Check if user type requires verification
    if (req.user.userType === 'RETAILER' || req.user.userType === 'WHOLESALER') {
      if (!req.user.isVerified) {
        res.status(403).json({
          success: false,
          message: 'Account verification required. Please complete verification process.',
        });
        return;
      }
    }

    next();
  } catch (error: any) {
    logger.error('❌ Verification check error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification check failed',
      error: error.message,
    });
  }
};

export default {
  requireRole,
  requireCustomer,
  requireRetailer,
  requireWholesaler,
  requireSeller,
  requireOwnership,
  requireVerified,
};
