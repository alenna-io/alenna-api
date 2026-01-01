import { IBillingRecordRepository, ITuitionConfigRepository, IStudentScholarshipRepository, ITuitionTypeRepository } from '../../../adapters_interface/repositories';
import { BillingRecord } from '../../../domain/entities';

export class BulkUpdateBillingRecordsUseCase {
  constructor(
    private billingRecordRepository: IBillingRecordRepository,
    private tuitionConfigRepository: ITuitionConfigRepository,
    private studentScholarshipRepository: IStudentScholarshipRepository,
    private tuitionTypeRepository: ITuitionTypeRepository
  ) {}

  async execute(
    schoolYearId: string,
    billingMonth: number,
    billingYear: number,
    schoolId: string,
    updatedBy: string
  ): Promise<{ updated: number; skipped: number }> {
    const tuitionConfig = await this.tuitionConfigRepository.findBySchoolId(schoolId);
    if (!tuitionConfig) {
      throw new Error('Tuition configuration not found. Please configure tuition settings first.');
    }

    // Get all tuition types for the school (for fallback)
    const tuitionTypes = await this.tuitionTypeRepository.findBySchoolId(schoolId);
    if (tuitionTypes.length === 0) {
      throw new Error('No tuition types found. Please create at least one tuition type first.');
    }
    const defaultTuitionType = tuitionTypes[0];

    // Get all existing billing records for this month/year
    const existingRecords = await this.billingRecordRepository.findByFilters({
      schoolId,
      schoolYearId,
      billingMonth,
      billingYear,
    });

    if (existingRecords.length === 0) {
      return { updated: 0, skipped: 0 };
    }

    let updated = 0;
    let skipped = 0;

    for (const record of existingRecords) {
      try {
        // Skip locked records or paid records (we don't want to modify payments)
        if (record.lockedAt !== null || record.paymentStatus === 'paid') {
          skipped++;
          continue;
        }

        // Get current scholarship for the student
        const scholarship = await this.studentScholarshipRepository.findByStudentId(record.studentId, schoolId);

        // Get tuition type (from scholarship or default)
        let tuitionType = defaultTuitionType;
        if (scholarship?.tuitionTypeId) {
          const foundType = await this.tuitionTypeRepository.findById(scholarship.tuitionTypeId, schoolId);
          if (foundType) {
            tuitionType = foundType;
          }
        }

        // Calculate new scholarship amount
        let newScholarshipAmount = 0;
        if (scholarship) {
          newScholarshipAmount = scholarship.calculateDiscount(record.effectiveTuitionAmount);
        }

        // Update taxable bill status based on current scholarship config
        const newTaxableBillStatus = scholarship?.taxableBillRequired ? 'required' : 'not_required';

        // Only update if scholarship amount or taxable bill status changed
        // We preserve effectiveTuitionAmount, discountAdjustments, and extraCharges
        // Only recalculate based on new scholarship
        const discountAmount = BillingRecord.calculateDiscountAmount(record.discountAdjustments, record.effectiveTuitionAmount - newScholarshipAmount);
        const extraAmount = BillingRecord.calculateExtraAmount(record.extraCharges);
        const amountAfterDiscounts = record.effectiveTuitionAmount - newScholarshipAmount - discountAmount;
        
        // Recalculate late fee if overdue and not already applied
        let newLateFeeAmount = record.lateFeeAmount;
        const now = new Date();
        const isOverdue = now > record.dueDate;
        if (isOverdue && record.lateFeeAmount === 0 && newTaxableBillStatus !== 'not_required') {
          if (tuitionType.lateFeeType === 'fixed') {
            newLateFeeAmount = tuitionType.lateFeeValue;
          } else {
            newLateFeeAmount = amountAfterDiscounts * (tuitionType.lateFeeValue / 100);
          }
        }

        const newFinalAmount = amountAfterDiscounts + extraAmount + newLateFeeAmount;

        // Only update if values actually changed
        if (record.scholarshipAmount !== newScholarshipAmount ||
            record.billStatus !== newTaxableBillStatus ||
            record.lateFeeAmount !== newLateFeeAmount ||
            record.finalAmount !== newFinalAmount) {
          
          // Create updated record with new values
          const updatedRecord = new BillingRecord(
            record.id,
            record.studentId,
            record.schoolYearId,
            record.billingMonth,
            record.billingYear,
            {
              ...record.tuitionTypeSnapshot,
              tuitionTypeId: tuitionType.id,
              tuitionTypeName: tuitionType.name,
              baseAmount: tuitionType.baseAmount,
              lateFeeType: tuitionType.lateFeeType,
              lateFeeValue: tuitionType.lateFeeValue,
            },
            record.effectiveTuitionAmount, // Preserve original
            newScholarshipAmount,
            record.discountAdjustments, // Preserve discounts
            record.extraCharges, // Preserve extra charges
            newLateFeeAmount,
            newFinalAmount,
            newTaxableBillStatus,
            record.paymentStatus, // Preserve payment status
            record.paidAmount, // Preserve paid amount
            record.paidAt, // Preserve paid date
            record.lockedAt, // Preserve locked status
            {
              ...record.auditMetadata,
              updatedBy,
            },
            record.paymentNote,
            record.paymentMethod,
            record.paymentGateway,
            record.paymentTransactionId,
            record.paymentGatewayStatus,
            record.paymentWebhookReceivedAt,
            record.dueDate,
            record.createdAt,
            new Date()
          );

          await this.billingRecordRepository.update(record.id, updatedRecord, schoolId);
          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error updating billing record ${record.id}:`, error);
        skipped++;
      }
    }

    return { updated, skipped };
  }
}

