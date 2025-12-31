import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { BulkApplyLateFeeInput } from '../../dtos';

export class BulkApplyLateFeeUseCase {
  constructor(
    private billingRecordRepository: IBillingRecordRepository
  ) { }

  async execute(schoolId: string, input: BulkApplyLateFeeInput, appliedBy: string): Promise<number> {
    const dueDate = input.dueDate ? new Date(input.dueDate) : new Date();

    let bills: any[];
    if (input.billingRecordIds && input.billingRecordIds.length > 0) {
      bills = await Promise.all(
        input.billingRecordIds.map(id => this.billingRecordRepository.findById(id, schoolId))
      );
      bills = bills.filter(b => b !== null && !b.isLocked && b.paymentStatus !== 'paid' && b.billStatus !== 'cancelled' && b.lateFeeAmount === 0);
    } else {
      bills = await this.billingRecordRepository.findBillsRequiringLateFee(schoolId, dueDate);
    }

    let appliedCount = 0;

    for (const bill of bills) {
      try {
        if (!bill.isLocked && bill.paymentStatus !== 'paid' && bill.billStatus !== 'cancelled' && bill.lateFeeAmount === 0 && bill.isOverdue) {
          const updatedRecord = bill.applyLateFee(appliedBy);
          await this.billingRecordRepository.update(bill.id, updatedRecord, schoolId);
          appliedCount++;
        }
      } catch (error) {
        console.error(`Error applying late fee to bill ${bill.id}:`, error);
      }
    }

    return appliedCount;
  }
}
