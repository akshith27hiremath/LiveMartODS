import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.model';
import Customer from '../models/Customer.model';
import { jwtService } from './jwt.service';
import { logger } from '../utils/logger';

/**
 * OAuth Service
 * Handles Google and Facebook OAuth authentication
 */

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const FACEBOOK_CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/auth/facebook/callback';

/**
 * Initialize Passport with OAuth strategies
 */
export const initializeOAuth = (): void => {
  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id).select('-password');
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: GOOGLE_CALLBACK_URL,
          scope: ['profile', 'email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await User.findOne({
              $or: [
                { 'oauth.google.id': profile.id },
                { email: profile.emails?.[0]?.value },
              ],
            });

            if (user) {
              // Update Google OAuth data if not set
              if (!user.oauth?.google?.id) {
                user.oauth = {
                  ...user.oauth,
                  google: {
                    id: profile.id,
                    email: profile.emails?.[0]?.value || '',
                  },
                };
                await user.save();
              }
            } else {
              // Create new customer user
              user = await Customer.create({
                email: profile.emails?.[0]?.value,
                userType: 'CUSTOMER',
                profile: {
                  name: profile.displayName || 'Google User',
                  phone: '', // Will be filled later
                  avatar: profile.photos?.[0]?.value,
                },
                oauth: {
                  google: {
                    id: profile.id,
                    email: profile.emails?.[0]?.value || '',
                  },
                },
                isActive: true,
                isVerified: true, // Email verified by Google
              });

              logger.info(`✅ New user created via Google OAuth: ${user.email}`);
            }

            done(null, user);
          } catch (error: any) {
            logger.error('❌ Google OAuth error:', error);
            done(error, undefined);
          }
        }
      )
    );
  } else {
    logger.warn('⚠️  Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.');
  }

  // Facebook OAuth Strategy
  if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: FACEBOOK_APP_ID,
          clientSecret: FACEBOOK_APP_SECRET,
          callbackURL: FACEBOOK_CALLBACK_URL,
          profileFields: ['id', 'displayName', 'email', 'photos'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            // Check if user already exists
            let user = await User.findOne({
              $or: [
                { 'oauth.facebook.id': profile.id },
                { email: profile.emails?.[0]?.value },
              ],
            });

            if (user) {
              // Update Facebook OAuth data if not set
              if (!user.oauth?.facebook?.id) {
                user.oauth = {
                  ...user.oauth,
                  facebook: {
                    id: profile.id,
                    email: profile.emails?.[0]?.value || '',
                  },
                };
                await user.save();
              }
            } else {
              // Create new customer user
              user = await Customer.create({
                email: profile.emails?.[0]?.value,
                userType: 'CUSTOMER',
                profile: {
                  name: profile.displayName || 'Facebook User',
                  phone: '', // Will be filled later
                  avatar: profile.photos?.[0]?.value,
                },
                oauth: {
                  facebook: {
                    id: profile.id,
                    email: profile.emails?.[0]?.value || '',
                  },
                },
                isActive: true,
                isVerified: true, // Email verified by Facebook
              });

              logger.info(`✅ New user created via Facebook OAuth: ${user.email}`);
            }

            done(null, user);
          } catch (error: any) {
            logger.error('❌ Facebook OAuth error:', error);
            done(error, undefined);
          }
        }
      )
    );
  } else {
    logger.warn('⚠️  Facebook OAuth not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment variables.');
  }
};

/**
 * Generate tokens for OAuth user
 */
export const generateOAuthTokens = async (user: any) => {
  const tokens = jwtService.generateTokenPair({
    userId: user._id.toString(),
    email: user.email,
    userType: user.userType,
  });

  // Store refresh token in Redis
  await jwtService.storeRefreshToken(user._id.toString(), tokens.refreshToken);

  return tokens;
};

export default {
  initializeOAuth,
  generateOAuthTokens,
};
