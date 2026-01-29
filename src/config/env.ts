import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables (skip in test environment)
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const requiredEnvVars = [
  'DATABASE_URL',
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
];

if (!isTest) {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  database: {
    url: process.env.DATABASE_URL || (isTest ? 'postgresql://test:test@localhost:5432/test' : ''),
  },

  clerk: {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY || (isTest ? 'pk_test_dummy' : ''),
    secretKey: process.env.CLERK_SECRET_KEY || (isTest ? 'sk_test_dummy' : ''),
  },
};

