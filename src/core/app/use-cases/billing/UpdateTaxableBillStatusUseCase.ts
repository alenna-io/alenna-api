import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { BillingRecord, TaxableBillStatus } from '../../../domain/entities';

export class UpdateTaxableBillStatusUseCase {
  constructor(private billingRecordRepository: IBillingRecordRepository) { }

  async execute(billingRecordId: string, schoolId: string, newStatus: TaxableBillStatus, updatedBy: string): Promise<BillingRecord> {
    const billingRecord = await this.billingRecordRepository.findById(billingRecordId, schoolId);
    if (!billingRecord) {
      throw new Error('Billing record not found');
    }

    // Allow updating taxable bill status for paid bills even if locked
    if (billingRecord.lockedAt !== null && billingRecord.paymentStatus !== 'paid') {
      throw new Error('Cannot update taxable bill status of a locked bill');
    }

    const updatedRecord = billingRecord.updateTaxableBillStatus(newStatus, updatedBy);

    return await this.billingRecordRepository.update(billingRecordId, updatedRecord, schoolId);
  }
}

