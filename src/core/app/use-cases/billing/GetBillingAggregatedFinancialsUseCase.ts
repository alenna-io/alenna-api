import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { GetBillingAggregatedFinancialsInput } from '../../dtos';

export class GetBillingAggregatedFinancialsUseCase {
  constructor(private billingRecordRepository: IBillingRecordRepository) {}

  async execute(input: GetBillingAggregatedFinancialsInput, schoolId: string): Promise<{
    totalIncome: number;
    expectedIncome: number;
    missingIncome: number;
    totalStudentsPaid: number;
    totalStudentsNotPaid: number;
    lateFeesApplied: number;
  }> {
    // Apply default filters: if no filters provided, use current month
    const now = new Date();
    let billingMonth = input.billingMonth;
    let billingYear = input.billingYear;
    let startDate = input.startDate ? new Date(input.startDate) : undefined;
    let endDate = input.endDate ? new Date(input.endDate) : undefined;

    // If no filters at all, default to current month
    if (!billingMonth && !billingYear && !startDate && !endDate) {
      billingMonth = now.getMonth() + 1;
      billingYear = now.getFullYear();
    }

    const filters: any = {
      schoolId,
      studentId: input.studentId,
      schoolYearId: input.schoolYearId,
      paymentStatus: input.paymentStatus,
      billingMonth,
      billingYear,
      startDate,
      endDate,
    };

    return await this.billingRecordRepository.getMetrics(filters);
  }
}

