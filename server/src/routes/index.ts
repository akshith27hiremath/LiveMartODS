import { Router } from 'express';
import passport from 'passport';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import { generateOAuthTokens } from '../services/oauth.service';

/**
 * Main Routes Index
 * Aggregates all route modules
 */

const router = Router();

// API health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

/**
 * OAuth Routes
 */

// Google OAuth
router.get(
  '/auth/google',
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect('/login?error=oauth_failed');
      }

      // Generate JWT tokens
      const tokens = await generateOAuthTokens(req.user);

      // In production, redirect to frontend with tokens
      // For now, send JSON response
      res.json({
        success: true,
        message: 'Google authentication successful',
        data: {
          user: req.user,
          tokens,
        },
      });
    } catch (error) {
      res.redirect('/login?error=oauth_failed');
    }
  }
);

// Facebook OAuth
router.get(
  '/auth/facebook',
  passport.authenticate('facebook', { session: false, scope: ['email'] })
);

router.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect('/login?error=oauth_failed');
      }

      // Generate JWT tokens
      const tokens = await generateOAuthTokens(req.user);

      // In production, redirect to frontend with tokens
      // For now, send JSON response
      res.json({
        success: true,
        message: 'Facebook authentication successful',
        data: {
          user: req.user,
          tokens,
        },
      });
    } catch (error) {
      res.redirect('/login?error=oauth_failed');
    }
  }
);

// 404 handler for /api routes
router.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
  });
});

export default router;
