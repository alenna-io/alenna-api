import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { BillingRecord } from '../../../domain/entities';
import { UpdateBillingRecordInput } from '../../dtos';

export class UpdateBillingRecordUseCase {
  constructor(private billingRecordRepository: IBillingRecordRepository) { }

  async execute(billingRecordId: string, schoolId: string, input: UpdateBillingRecordInput, updatedBy: string): Promise<BillingRecord> {
    const billingRecord = await this.billingRecordRepository.findById(billingRecordId, schoolId);
    if (!billingRecord) {
      throw new Error('Billing record not found');
    }

    if (billingRecord.lockedAt !== null) {
      throw new Error('Cannot update a locked bill');
    }

    const updateProps: {
      effectiveTuitionAmount?: number;
      discountAdjustments?: any[];
      extraCharges?: any[];
      billStatus?: any;
      updatedBy: string;
    } = {
      updatedBy,
    };

    if (input.effectiveTuitionAmount !== undefined) {
      updateProps.effectiveTuitionAmount = input.effectiveTuitionAmount;
    }

    if (input.discountAdjustments !== undefined) {
      updateProps.discountAdjustments = input.discountAdjustments;
    }

    if (input.extraCharges !== undefined) {
      updateProps.extraCharges = input.extraCharges;
    }

    // Handle taxableBillStatus (preferred) or billStatus (backward compatibility)
    if (input.taxableBillStatus !== undefined) {
      updateProps.billStatus = input.taxableBillStatus;
    } else if (input.billStatus !== undefined) {
      // Map old status values to new ones
      if (input.billStatus === 'cancelled') {
        updateProps.billStatus = 'not_required';
      } else {
        updateProps.billStatus = input.billStatus;
      }
    }

    const updatedRecord = billingRecord.update(updateProps);

    return await this.billingRecordRepository.update(billingRecordId, updatedRecord, schoolId);
  }
}
