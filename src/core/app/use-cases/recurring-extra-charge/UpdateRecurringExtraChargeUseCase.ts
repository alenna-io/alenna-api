import { RecurringExtraCharge } from '../../../domain/entities';
import { IRecurringExtraChargeRepository } from '../../../adapters_interface/repositories';
import { UpdateRecurringExtraChargeInput } from '../../dtos/RecurringExtraChargeDTO';

export class UpdateRecurringExtraChargeUseCase {
  constructor(
    private recurringExtraChargeRepository: IRecurringExtraChargeRepository
  ) {}

  async execute(
    id: string,
    input: UpdateRecurringExtraChargeInput,
    schoolId: string
  ): Promise<RecurringExtraCharge> {
    const existing = await this.recurringExtraChargeRepository.findById(id, schoolId);
    if (!existing) {
      throw new Error('Recurring extra charge not found');
    }

    const updateData: Partial<RecurringExtraCharge> = {};

    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.amount !== undefined) {
      updateData.amount = input.amount;
    }
    if (input.expiresAt !== undefined) {
      updateData.expiresAt = new Date(input.expiresAt);
    }

    return await this.recurringExtraChargeRepository.update(id, updateData);
  }
}

