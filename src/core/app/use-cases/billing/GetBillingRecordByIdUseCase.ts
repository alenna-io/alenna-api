import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { BillingRecord } from '../../../domain/entities';

export class GetBillingRecordByIdUseCase {
  constructor(private billingRecordRepository: IBillingRecordRepository) {}

  async execute(id: string, schoolId: string): Promise<BillingRecord | null> {
    return await this.billingRecordRepository.findById(id, schoolId);
  }
}

