import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { BulkApplyLateFeeInput } from '../../dtos';
import { BillingRecord } from '../../../domain/entities';

export class BulkApplyLateFeeUseCase {
  constructor(
    private billingRecordRepository: IBillingRecordRepository
  ) { }

  async execute(schoolId: string, input: BulkApplyLateFeeInput, appliedBy: string): Promise<number> {
    const dueDate = input.dueDate ? new Date(input.dueDate) : new Date();

    let bills: BillingRecord[];
    if (input.billingRecordIds && input.billingRecordIds.length > 0) {
      const foundBills = await Promise.all(
        input.billingRecordIds.map(id => this.billingRecordRepository.findById(id, schoolId))
      );
      bills = foundBills.filter((b): b is BillingRecord => 
        b !== null && 
        !b.isLocked && 
        b.paymentStatus !== 'paid' && 
        b.billStatus !== 'not_required' && 
        b.lateFeeAmount === 0
      );
    } else {
      bills = await this.billingRecordRepository.findBillsRequiringLateFee(schoolId, dueDate);
    }

    let appliedCount = 0;

    for (const bill of bills) {
      try {
        if (!bill.isLocked && 
            bill.paymentStatus !== 'paid' && 
            bill.billStatus !== 'not_required' && 
            bill.lateFeeAmount === 0 && 
            bill.isOverdue) {
          
          // First mark as delayed if not already
          let updatedRecord = bill.markAsDelayed();
          
          // Calculate amount after discounts for late fee calculation
          const amountAfterDiscounts = updatedRecord.effectiveTuitionAmount
            - updatedRecord.scholarshipAmount
            - BillingRecord.calculateDiscountAmount(updatedRecord.discountAdjustments, updatedRecord.effectiveTuitionAmount - updatedRecord.scholarshipAmount);
          
          // Apply late fee
          updatedRecord = updatedRecord.applyLateFee(amountAfterDiscounts, appliedBy);
          
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
