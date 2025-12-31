import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { GetBillingMetricsInput } from '../../dtos';

export class GetBillingMetricsUseCase {
  constructor(private billingRecordRepository: IBillingRecordRepository) {}

  async execute(input: GetBillingMetricsInput, schoolId: string) {
    const filters: any = {
      schoolId,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      schoolYearId: input.schoolYearId,
    };

    return await this.billingRecordRepository.getMetrics(filters);
  }
}

