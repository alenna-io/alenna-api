/// <reference types="node" />
import { MonthlyBillingJob } from '../src/core/app/jobs/MonthlyBillingJob';
import { logger } from '../src/utils/logger';
import prisma from '../src/core/frameworks/database/prisma.client';

async function main() {
  logger.info('Starting manual billing job execution...');

  try {
    const billingJob = new MonthlyBillingJob();
    await billingJob.execute();
    logger.info('Billing job completed successfully');
  } catch (error) {
    logger.error('Error running billing job:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

