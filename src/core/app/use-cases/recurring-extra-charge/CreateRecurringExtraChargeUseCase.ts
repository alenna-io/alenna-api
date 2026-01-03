import { randomUUID } from 'crypto';
import { RecurringExtraCharge } from '../../../domain/entities';
import { IRecurringExtraChargeRepository } from '../../../adapters_interface/repositories';
import { CreateRecurringExtraChargeInput } from '../../dtos/RecurringExtraChargeDTO';

export class CreateRecurringExtraChargeUseCase {
  constructor(
    private recurringExtraChargeRepository: IRecurringExtraChargeRepository
  ) {}

  async execute(
    input: CreateRecurringExtraChargeInput,
    studentId: string
  ): Promise<RecurringExtraCharge> {
    const expiresAt = new Date(input.expiresAt);

    const charge = RecurringExtraCharge.create({
      id: randomUUID(),
      studentId,
      description: input.description,
      amount: input.amount,
      expiresAt,
    });

    return await this.recurringExtraChargeRepository.create(charge);
  }
}

