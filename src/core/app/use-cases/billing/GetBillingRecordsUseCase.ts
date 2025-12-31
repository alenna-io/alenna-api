import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { BillingRecord } from '../../../domain/entities';
import { GetBillingRecordsInput } from '../../dtos';

export class GetBillingRecordsUseCase {
  constructor(private billingRecordRepository: IBillingRecordRepository) {}

  async execute(input: GetBillingRecordsInput, schoolId: string): Promise<BillingRecord[]> {
    const filters: any = {
      schoolId,
      studentId: input.studentId,
      schoolYearId: input.schoolYearId,
      billingMonth: input.billingMonth,
      billingYear: input.billingYear,
      paymentStatus: input.paymentStatus,
      billStatus: input.billStatus,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    };

    return await this.billingRecordRepository.findByFilters(filters);
  }
}
