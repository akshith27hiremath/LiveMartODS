import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import passport from 'passport';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import { redisService } from './config/redis';
import { initializeOAuth } from './services/oauth.service';
import { logger } from './utils/logger';
import apiRoutes from './routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());
initializeOAuth();

// Basic routes for testing
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Live MART API',
    version: '1.0.0',
    status: 'running',
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// Test database models endpoint (legacy - for backward compatibility)
app.get('/api/test/models', async (_req: Request, res: Response) => {
  try {
    // Import models (this will register them with mongoose)
    const User = (await import('./models/User.model')).default;
    const Customer = (await import('./models/Customer.model')).default;
    const Retailer = (await import('./models/Retailer.model')).default;
    const Wholesaler = (await import('./models/Wholesaler.model')).default;

    // Get collection names
    const collections = await User.db.db?.listCollections().toArray();
    const collectionNames = collections?.map(c => c.name) || [];

    res.json({
      success: true,
      message: 'Models loaded successfully',
      models: {
        User: User.modelName,
        Customer: Customer.modelName,
        Retailer: Retailer.modelName,
        Wholesaler: Wholesaler.modelName,
      },
      collections: collectionNames,
      database: User.db.name,
    });
  } catch (error: any) {
    logger.error('Error testing models:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing models',
      error: error.message,
    });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Route not found',
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong',
  });
});

// Start server function
const startServer = async () => {
  try {
    // Initialize database connection
    logger.info('🔌 Connecting to database...');
    await initializeDatabase();

    // Initialize Redis connection
    logger.info('🔌 Connecting to Redis...');
    await redisService.connect();

    // Start Express server
    app.listen(PORT, () => {
      logger.info('=================================');
      logger.info(`🚀 Live MART API Server Started`);
      logger.info(`📡 Port: ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 URL: http://localhost:${PORT}`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/api/health`);
      logger.info(`🔐 Auth Endpoints: http://localhost:${PORT}/api/auth`);
      logger.info('=================================');
    });
  } catch (error) {
    logger.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
