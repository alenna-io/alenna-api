import prisma from '../../frameworks/database/prisma.client';
import { BillingRecordRepository } from '../../frameworks/database/repositories/BillingRecordRepository';
import { BillingRecordMapper } from '../../frameworks/database/mappers/BillingRecordMapper';
import { BillingRecord } from '../../domain/entities';
import { logger } from '../../../utils/logger';

export class UpdateDelayedBillingRecordsJob {
  private billingRecordRepository: BillingRecordRepository;

  constructor() {
    this.billingRecordRepository = new BillingRecordRepository();
  }

  async execute(): Promise<void> {
    const now = new Date();
    logger.info(`Running delayed billing records update job at ${now.toISOString()}`);

    // Find all records that should be marked as delayed
    // Conditions:
    // - paymentStatus is 'pending' (partial_payment can remain partial even if overdue)
    // - dueDate < current date
    // - paidAt is null
    // - lockedAt is null
    const recordsToUpdate = await prisma.billingRecord.findMany({
      where: {
        paymentStatus: 'pending',
        dueDate: {
          lt: now,
        },
        paidAt: null,
        lockedAt: null, // Don't update locked records
        student: {
          deletedAt: null, // Only active students
        },
      },
      include: {
        student: {
          select: {
            schoolId: true,
          },
        },
      },
    });

    if (recordsToUpdate.length === 0) {
      logger.info('No billing records found to mark as delayed');
      return;
    }

    logger.info(`Found ${recordsToUpdate.length} billing record(s) to mark as delayed`);

    let updatedCount = 0;

    for (const prismaRecord of recordsToUpdate) {
      try {
        const billingRecord = BillingRecordMapper.toDomain(prismaRecord);
        const schoolId = prismaRecord.student.schoolId;
        let updatedRecord = billingRecord.markAsDelayed();

        // Apply late fee if not already applied (only for bills that require taxable bills)
        if (updatedRecord.paymentStatus === 'delayed' &&
          updatedRecord.lateFeeAmount === 0 &&
          updatedRecord.billStatus !== 'not_required') {
          // Calculate amount after discounts for late fee calculation
          const amountAfterDiscounts = updatedRecord.effectiveTuitionAmount
            - updatedRecord.scholarshipAmount
            - BillingRecord.calculateDiscountAmount(updatedRecord.discountAdjustments, updatedRecord.effectiveTuitionAmount - updatedRecord.scholarshipAmount);

          updatedRecord = updatedRecord.applyLateFee(amountAfterDiscounts, 'system');
        }

        // Only update if status or late fee actually changed
        if (updatedRecord.paymentStatus !== billingRecord.paymentStatus ||
          updatedRecord.lateFeeAmount !== billingRecord.lateFeeAmount) {
          await this.billingRecordRepository.update(prismaRecord.id, updatedRecord, schoolId);
          updatedCount++;
        }
      } catch (error) {
        logger.error(`Error updating billing record ${prismaRecord.id} to delayed status:`, error);
      }
    }

    logger.info(`Successfully updated ${updatedCount} billing record(s) to delayed status`);
  }
}

