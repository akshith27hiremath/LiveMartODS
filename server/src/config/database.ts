import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Database Configuration and Connection Management
 * Handles MongoDB connection with retry logic and error handling
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/livemart_dev';
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Connect to MongoDB with retry logic
 */
export const connectDatabase = async (): Promise<void> => {
  let retryCount = 0;

  const connect = async (): Promise<void> => {
    try {
      const options: mongoose.ConnectOptions = {
        maxPoolSize: 10, // Connection pool size
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000,
        family: 4, // Use IPv4, skip IPv6
      };

      await mongoose.connect(MONGODB_URI, options);

      logger.info('✅ MongoDB connected successfully');
      logger.info(`📊 Database: ${mongoose.connection.name}`);
      logger.info(`🌐 Host: ${mongoose.connection.host}`);

      // Monitor connection events
      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('✅ MongoDB reconnected successfully');
      });

      mongoose.connection.on('error', (err) => {
        logger.error('❌ MongoDB connection error:', err);
      });

    } catch (error) {
      retryCount++;
      logger.error(`❌ MongoDB connection failed (Attempt ${retryCount}/${MAX_RETRY_ATTEMPTS}):`, error);

      if (retryCount < MAX_RETRY_ATTEMPTS) {
        logger.info(`🔄 Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return connect();
      } else {
        logger.error('💥 Max retry attempts reached. Exiting...');
        process.exit(1);
      }
    }
  };

  await connect();
};

/**
 * Disconnect from MongoDB gracefully
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('✅ MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};

/**
 * Get database connection status
 */
export const getDatabaseStatus = (): {
  connected: boolean;
  status: string;
  host?: string;
  database?: string;
} => {
  const state = mongoose.connection.readyState;
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    connected: state === 1,
    status: stateMap[state] || 'unknown',
    host: mongoose.connection.host,
    database: mongoose.connection.name,
  };
};

/**
 * Setup database event handlers
 */
export const setupDatabaseEventHandlers = (): void => {
  // Handle process termination
  process.on('SIGINT', async () => {
    logger.info('🛑 SIGINT signal received. Closing MongoDB connection...');
    await disconnectDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('🛑 SIGTERM signal received. Closing MongoDB connection...');
    await disconnectDatabase();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    logger.error('💥 Uncaught Exception:', error);
    await disconnectDatabase();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    await disconnectDatabase();
    process.exit(1);
  });
};

/**
 * Initialize database connection and event handlers
 */
export const initializeDatabase = async (): Promise<void> => {
  setupDatabaseEventHandlers();
  await connectDatabase();
};

export default {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  setupDatabaseEventHandlers,
  initializeDatabase,
};
