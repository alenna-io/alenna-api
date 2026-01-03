import { RecurringExtraCharge } from '../../../domain/entities';
import { IRecurringExtraChargeRepository } from '../../../adapters_interface/repositories';

export class GetRecurringExtraChargesUseCase {
  constructor(
    private recurringExtraChargeRepository: IRecurringExtraChargeRepository
  ) {}

  async execute(studentId: string, schoolId: string): Promise<RecurringExtraCharge[]> {
    return await this.recurringExtraChargeRepository.findByStudentId(studentId, schoolId);
  }
}

