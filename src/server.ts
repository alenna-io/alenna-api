import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cron from 'node-cron';
import { config } from './config/env';
import { logger } from './utils/logger';
import routes from './core/frameworks/api/routes';
import { AutoCloseQuartersJob } from './core/app/jobs/AutoCloseQuartersJob';
import { MonthlyBillingJob } from './core/app/jobs/MonthlyBillingJob';

// Initialize Express app
const app: express.Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // HTTP request logging
app.use(express.json()); // Parse JSON bodies
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

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(config.isDevelopment && { stack: err.stack }),
  });
});

// Initialize scheduled jobs
const autoCloseQuartersJob = new AutoCloseQuartersJob();
const monthlyBillingJob = new MonthlyBillingJob();

// Schedule auto-close quarters job to run daily at 2 AM
// Cron format: minute hour day month day-of-week
// '0 2 * * *' means: at 2:00 AM every day
cron.schedule('0 2 * * *', async () => {
  logger.info('Running scheduled job: AutoCloseQuartersJob');
  try {
    await autoCloseQuartersJob.execute();
    logger.info('AutoCloseQuartersJob completed successfully');
  } catch (error) {
    logger.error('Error in AutoCloseQuartersJob:', error);
  }
});

// Schedule monthly billing job to run on the 1st of each month at 12:00 AM
// Cron format: minute hour day month day-of-week
// '0 0 1 * *' means: at 12:00 AM on the 1st day of every month
cron.schedule('0 0 1 * *', async () => {
  logger.info('Running scheduled job: MonthlyBillingJob');
  try {
    await monthlyBillingJob.execute();
    logger.info('MonthlyBillingJob completed successfully');
  } catch (error) {
    logger.error('Error in MonthlyBillingJob:', error);
  }
});

logger.info('📅 Scheduled jobs initialized:');
logger.info('  - AutoCloseQuartersJob (daily at 2 AM)');
logger.info('  - MonthlyBillingJob (1st of each month at 12 AM)');

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
