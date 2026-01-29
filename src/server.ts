import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { clerkMiddleware } from '@clerk/express';
import { config } from './config/env';
import { logger } from './utils/logger';
import routes from './core/infrastructure/frameworks/api/routes';
import { errorHandler } from './core/infrastructure/frameworks/api/middleware';

// Initialize Express app
const app: express.Application = express();

// Initialize Clerk middleware
app.use(clerkMiddleware({
  publishableKey: config.clerk.publishableKey,
  secretKey: config.clerk.secretKey,
}));

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // HTTP request logging
app.use(express.json({ strict: true })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API Routes
app.use('/api', routes);


// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server - listening on all interfaces for Docker/Fly.io
app.listen(config.port, '0.0.0.0', () => {
  logger.info(`🚀 Server running on http://0.0.0.0:${config.port}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🏗️  Clean Architecture enabled`);
  logger.info(`🔐 Clerk authentication configured`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
