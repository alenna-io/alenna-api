import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { RecordManualPaymentInput } from '../../dtos';

export class RecordManualPaymentUseCase {
  constructor(private billingRecordRepository: IBillingRecordRepository) {}

  async execute(billingRecordId: string, schoolId: string, input: RecordManualPaymentInput, paidBy: string): Promise<void> {
    const billingRecord = await this.billingRecordRepository.findById(billingRecordId, schoolId);
    if (!billingRecord) {
      throw new Error('Billing record not found');
    }

    const updatedRecord = billingRecord.markAsPaid({
      paymentMethod: input.paymentMethod,
      paymentNote: input.paymentNote,
      paidBy,
    });

    await this.billingRecordRepository.update(billingRecordId, updatedRecord, schoolId);
  }
}

