import { IRecurringExtraChargeRepository } from '../../../adapters_interface/repositories';

export class DeleteRecurringExtraChargeUseCase {
  constructor(
    private recurringExtraChargeRepository: IRecurringExtraChargeRepository
  ) {}

  async execute(id: string, schoolId: string): Promise<void> {
    const existing = await this.recurringExtraChargeRepository.findById(id, schoolId);
    if (!existing) {
      throw new Error('Recurring extra charge not found');
    }

    await this.recurringExtraChargeRepository.delete(id, schoolId);
  }
}

