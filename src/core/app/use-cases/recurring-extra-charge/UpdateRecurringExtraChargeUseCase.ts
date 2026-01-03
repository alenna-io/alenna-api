import { RecurringExtraCharge } from '../../../domain/entities';
import { IRecurringExtraChargeRepository } from '../../../adapters_interface/repositories';
import { UpdateRecurringExtraChargeInput } from '../../dtos/RecurringExtraChargeDTO';

export class UpdateRecurringExtraChargeUseCase {
  constructor(
    private recurringExtraChargeRepository: IRecurringExtraChargeRepository
  ) { }

  async execute(
    id: string,
    input: UpdateRecurringExtraChargeInput,
    schoolId: string
  ): Promise<RecurringExtraCharge> {
    const existing = await this.recurringExtraChargeRepository.findById(id, schoolId);
    if (!existing) {
      throw new Error('Recurring extra charge not found');
    }

    const updatedEntity = existing.update({
      description: input.description,
      amount: input.amount,
      expiresAt: input.expiresAt
        ? new Date(input.expiresAt)
        : undefined
    });

    return await this.recurringExtraChargeRepository.update(id, updatedEntity);
  }
}

