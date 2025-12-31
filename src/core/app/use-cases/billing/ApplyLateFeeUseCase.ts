import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { ApplyLateFeeInput } from '../../dtos';
import { BillingRecord } from '../../../domain/entities';

export class ApplyLateFeeUseCase {
  constructor(
    private billingRecordRepository: IBillingRecordRepository
  ) { }

  async execute(billingRecordId: string, schoolId: string, input: ApplyLateFeeInput, appliedBy: string): Promise<void> {
    const billingRecord = await this.billingRecordRepository.findById(billingRecordId, schoolId);
    if (!billingRecord) {
      throw new Error('Billing record not found');
    }

    // Calculate amount after discounts and scholarship for late fee calculation
    const amountAfterDiscounts = billingRecord.effectiveTuitionAmount 
      - billingRecord.scholarshipAmount 
      - BillingRecord.calculateDiscountAmount(billingRecord.discountAdjustments, billingRecord.effectiveTuitionAmount - billingRecord.scholarshipAmount);

    const updatedRecord = billingRecord.applyLateFee(amountAfterDiscounts, appliedBy);
    await this.billingRecordRepository.update(billingRecordId, updatedRecord, schoolId);
  }
}
