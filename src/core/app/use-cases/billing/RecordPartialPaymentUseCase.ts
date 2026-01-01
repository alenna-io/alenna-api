import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { RecordPartialPaymentInput } from '../../dtos';

export class RecordPartialPaymentUseCase {
  constructor(private billingRecordRepository: IBillingRecordRepository) { }

  async execute(billingRecordId: string, schoolId: string, input: RecordPartialPaymentInput, paidBy: string): Promise<void> {
    const billingRecord = await this.billingRecordRepository.findById(billingRecordId, schoolId);
    if (!billingRecord) {
      throw new Error('Billing record not found');
    }

    const updatedRecord = billingRecord.recordPartialPayment({
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paymentNote: input.paymentNote,
      paidBy,
    });

    // Update the billing record and create a payment transaction in a single transaction
    await this.billingRecordRepository.updateWithPaymentTransaction(
      billingRecordId,
      updatedRecord,
      {
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        paymentNote: input.paymentNote,
        paidBy,
        paidAt: new Date(),
      },
      schoolId
    );
  }
}

