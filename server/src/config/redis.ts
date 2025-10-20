import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

/**
 * Redis Configuration and Connection Management
 * Used for caching, session storage, and token blacklisting
 */

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 5000; // 5 seconds

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    let retryCount = 0;

    const attemptConnect = async (): Promise<void> => {
      try {
        this.client = createClient({
          url: REDIS_URL,
          socket: {
            connectTimeout: 10000,
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                logger.error('❌ Redis: Too many reconnection attempts');
                return new Error('Too many retries');
              }
              return Math.min(retries * 100, 3000);
            },
          },
        });

        // Error handler
        this.client.on('error', (err) => {
          logger.error('❌ Redis Client Error:', err);
          this.isConnected = false;
        });

        // Connection event
        this.client.on('connect', () => {
          logger.info('🔌 Connecting to Redis...');
        });

        // Ready event
        this.client.on('ready', () => {
          logger.info('✅ Redis connected successfully');
          this.isConnected = true;
        });

        // Disconnect event
        this.client.on('end', () => {
          logger.warn('⚠️  Redis disconnected');
          this.isConnected = false;
        });

        // Reconnecting event
        this.client.on('reconnecting', () => {
          logger.info('🔄 Redis reconnecting...');
        });

        await this.client.connect();
      } catch (error) {
        retryCount++;
        logger.error(`❌ Redis connection failed (Attempt ${retryCount}/${MAX_RETRY_ATTEMPTS}):`, error);

        if (retryCount < MAX_RETRY_ATTEMPTS) {
          logger.info(`🔄 Retrying in ${RETRY_DELAY / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return attemptConnect();
        } else {
          logger.error('💥 Max retry attempts reached. Redis connection failed.');
          // Don't exit process - Redis is optional for basic functionality
        }
      }
    };

    await attemptConnect();
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('✅ Redis disconnected gracefully');
      } catch (error) {
        logger.error('❌ Error disconnecting from Redis:', error);
      }
    }
  }

  /**
   * Get Redis client
   */
  getClient(): RedisClientType | null {
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Set a key-value pair with optional expiry
   */
  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis is not connected');
    }

    try {
      if (expirySeconds) {
        await this.client!.setEx(key, expirySeconds, value);
      } else {
        await this.client!.set(key, value);
      }
    } catch (error) {
      logger.error(`❌ Redis SET error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    if (!this.isReady()) {
      throw new Error('Redis is not connected');
    }

    try {
      return await this.client!.get(key);
    } catch (error) {
      logger.error(`❌ Redis GET error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis is not connected');
    }

    try {
      await this.client!.del(key);
    } catch (error) {
      logger.error(`❌ Redis DELETE error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) {
      throw new Error('Redis is not connected');
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`❌ Redis EXISTS error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Set expiry on a key
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis is not connected');
    }

    try {
      await this.client!.expire(key, seconds);
    } catch (error) {
      logger.error(`❌ Redis EXPIRE error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Get TTL (time to live) for a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isReady()) {
      throw new Error('Redis is not connected');
    }

    try {
      return await this.client!.ttl(key);
    } catch (error) {
      logger.error(`❌ Redis TTL error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.isReady()) {
      throw new Error('Redis is not connected');
    }

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(keys);
      }
    } catch (error) {
      logger.error(`❌ Redis DELETE PATTERN error for pattern "${pattern}":`, error);
      throw error;
    }
  }

  /**
   * Set object as JSON string
   */
  async setObject(key: string, value: any, expirySeconds?: number): Promise<void> {
    const jsonString = JSON.stringify(value);
    await this.set(key, jsonString, expirySeconds);
  }

  /**
   * Get object from JSON string
   */
  async getObject<T>(key: string): Promise<T | null> {
    const jsonString = await this.get(key);
    if (!jsonString) {
      return null;
    }
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      logger.error(`❌ Redis JSON parse error for key "${key}":`, error);
      return null;
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();

// Export for dependency injection if needed
export default redisService;
