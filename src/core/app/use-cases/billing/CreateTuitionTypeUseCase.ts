import { ITuitionTypeRepository } from '../../../adapters_interface/repositories';
import { TuitionType } from '../../../domain/entities';
import { CreateTuitionTypeInput } from '../../dtos';
import { randomUUID } from 'crypto';

export class CreateTuitionTypeUseCase {
  constructor(private tuitionTypeRepository: ITuitionTypeRepository) {}

  async execute(input: CreateTuitionTypeInput, schoolId: string): Promise<TuitionType> {
    const tuitionType = TuitionType.create({
      id: randomUUID(),
      schoolId,
      name: input.name,
      baseAmount: input.baseAmount,
      currency: input.currency ?? 'USD',
      lateFeeType: input.lateFeeType,
      lateFeeValue: input.lateFeeValue,
      displayOrder: input.displayOrder ?? 0,
    });

    return await this.tuitionTypeRepository.create(tuitionType);
  }
}

