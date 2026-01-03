import prisma from '../../frameworks/database/prisma.client';
import { BulkCreateBillingRecordsUseCase } from '../use-cases/billing/BulkCreateBillingRecordsUseCase';
import { BillingRecordRepository } from '../../frameworks/database/repositories/BillingRecordRepository';
import { TuitionConfigRepository } from '../../frameworks/database/repositories/TuitionConfigRepository';
import { StudentScholarshipRepository } from '../../frameworks/database/repositories/StudentScholarshipRepository';
import { TuitionTypeRepository } from '../../frameworks/database/repositories/TuitionTypeRepository';
import { StudentRepository } from '../../frameworks/database/repositories/StudentRepository';
import { RecurringExtraChargeRepository } from '../../frameworks/database/repositories/RecurringExtraChargeRepository';
import { logger } from '../../../utils/logger';
import { StudentBillingConfigRepository } from '../../frameworks/database/repositories/StudentBillingConfigRepository';

export class MonthlyBillingJob {
  private bulkCreateBillingRecordsUseCase: BulkCreateBillingRecordsUseCase;

  constructor() {
    const billingRecordRepository = new BillingRecordRepository();
    const tuitionConfigRepository = new TuitionConfigRepository();
    const studentScholarshipRepository = new StudentScholarshipRepository();
    const tuitionTypeRepository = new TuitionTypeRepository();
    const studentRepository = new StudentRepository();
    const recurringExtraChargeRepository = new RecurringExtraChargeRepository();
    const studentBillingConfigRepository = new StudentBillingConfigRepository();

    this.bulkCreateBillingRecordsUseCase = new BulkCreateBillingRecordsUseCase(
      billingRecordRepository,
      tuitionConfigRepository,
      studentScholarshipRepository,
      tuitionTypeRepository,
      studentRepository,
      recurringExtraChargeRepository,
      studentBillingConfigRepository
    );
  }

  async execute(): Promise<void> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // January = 1
    const currentYear = now.getFullYear();

    logger.info(`Running monthly billing job for ${currentMonth}/${currentYear}`);

    // Get all active schools
    const activeSchools = await prisma.school.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });

    if (activeSchools.length === 0) {
      logger.info('No active schools found for monthly billing');
      return;
    }

    logger.info(`Found ${activeSchools.length} active school(s) for monthly billing`);

    let totalBillsCreated = 0;

    for (const school of activeSchools) {
      try {
        // Get active school year for this school
        const activeSchoolYear = await prisma.schoolYear.findFirst({
          where: {
            schoolId: school.id,
            isActive: true,
            deletedAt: null,
          },
        });

        if (!activeSchoolYear) {
          logger.warn(`No active school year found for school ${school.name} (${school.id}), skipping billing`);
          continue;
        }

        // Get all active students for this school
        const activeStudents = await prisma.student.findMany({
          where: {
            schoolId: school.id,
            deletedAt: null,
          },
        });

        if (activeStudents.length === 0) {
          logger.info(`No active students found for school ${school.name}, skipping billing`);
          continue;
        }

        // Check if tuition config exists
        const tuitionConfig = await prisma.tuitionConfig.findUnique({
          where: {
            schoolId: school.id,
          },
        });

        if (!tuitionConfig) {
          logger.warn(`No tuition configuration found for school ${school.name} (${school.id}), skipping billing`);
          continue;
        }

        // Use a system user ID or create a placeholder
        // For scheduled jobs, we'll use a special system user ID
        // You may want to create a system user in your database for this purpose
        const systemUserId = 'system-monthly-billing-job';

        // Create billing records for all students
        const billingRecords = await this.bulkCreateBillingRecordsUseCase.execute(
          {
            schoolYearId: activeSchoolYear.id,
            billingMonth: currentMonth,
            billingYear: currentYear,
          },
          school.id,
          systemUserId
        );

        totalBillsCreated += billingRecords.length;
        logger.info(`Created ${billingRecords.length} billing record(s) for school ${school.name}`);
      } catch (error) {
        logger.error(`Error creating billing records for school ${school.id}:`, error);
      }
    }

    logger.info(`Monthly billing job completed. Created ${totalBillsCreated} billing record(s) across ${activeSchools.length} school(s)`);
  }
}

