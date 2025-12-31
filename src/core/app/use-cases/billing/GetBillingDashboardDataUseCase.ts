import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { GetBillingDashboardInput } from '../../dtos';

export class GetBillingDashboardDataUseCase {
  constructor(private billingRecordRepository: IBillingRecordRepository) {}

  async execute(input: GetBillingDashboardInput, schoolId: string) {
    const filters: any = {
      schoolId,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      schoolYearId: input.schoolYearId,
    };

    return await this.billingRecordRepository.getDashboardData(filters);
  }
}

