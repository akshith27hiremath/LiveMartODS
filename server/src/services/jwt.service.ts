import jwt from 'jsonwebtoken';
import { redisService } from '../config/redis';
import { logger } from '../utils/logger';

/**
 * JWT Service
 * Handles token generation, verification, and blacklisting
 */

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  userType: 'CUSTOMER' | 'RETAILER' | 'WHOLESALER';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class JWTService {
  /**
   * Generate access token
   */
  generateAccessToken(payload: TokenPayload): string {
    try {
      return jwt.sign(payload, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        algorithm: 'HS256',
      });
    } catch (error) {
      logger.error('❌ Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: TokenPayload): string {
    try {
      return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        algorithm: 'HS256',
      });
    } catch (error) {
      logger.error('❌ Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload: TokenPayload): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
      }) as TokenPayload;

      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      logger.error('❌ Error verifying access token:', error);
      throw new Error('Failed to verify access token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
      }) as TokenPayload;

      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      logger.error('❌ Error verifying refresh token:', error);
      throw new Error('Failed to verify refresh token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      logger.error('❌ Error decoding token:', error);
      return null;
    }
  }

  /**
   * Blacklist a token (for logout)
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token format');
      }

      // Calculate remaining TTL
      const currentTime = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - currentTime;

      if (ttl > 0) {
        const key = `blacklist:${token}`;
        await redisService.set(key, 'true', ttl);
        logger.info(`✅ Token blacklisted for ${ttl} seconds`);
      }
    } catch (error) {
      logger.error('❌ Error blacklisting token:', error);
      throw error;
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const key = `blacklist:${token}`;
      return await redisService.exists(key);
    } catch (error) {
      logger.error('❌ Error checking token blacklist:', error);
      // If Redis is down, assume token is not blacklisted to not block users
      return false;
    }
  }

  /**
   * Store refresh token in Redis
   */
  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      const key = `refresh:${userId}`;
      // Store for 7 days (same as token expiry)
      await redisService.set(key, refreshToken, 7 * 24 * 60 * 60);
    } catch (error) {
      logger.error('❌ Error storing refresh token:', error);
      throw error;
    }
  }

  /**
   * Get stored refresh token
   */
  async getRefreshToken(userId: string): Promise<string | null> {
    try {
      const key = `refresh:${userId}`;
      return await redisService.get(key);
    } catch (error) {
      logger.error('❌ Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Delete refresh token (for logout)
   */
  async deleteRefreshToken(userId: string): Promise<void> {
    try {
      const key = `refresh:${userId}`;
      await redisService.delete(key);
    } catch (error) {
      logger.error('❌ Error deleting refresh token:', error);
      throw error;
    }
  }

  /**
   * Delete all refresh tokens for a user (logout from all devices)
   */
  async deleteAllRefreshTokens(userId: string): Promise<void> {
    try {
      const pattern = `refresh:${userId}*`;
      await redisService.deletePattern(pattern);
    } catch (error) {
      logger.error('❌ Error deleting all refresh tokens:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const jwtService = new JWTService();

export default jwtService;
