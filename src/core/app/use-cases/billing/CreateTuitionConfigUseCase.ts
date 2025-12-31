import { ITuitionConfigRepository } from '../../../adapters_interface/repositories';
import { TuitionConfig } from '../../../domain/entities';
import { CreateTuitionConfigInput } from '../../dtos';
import { randomUUID } from 'crypto';

export class CreateTuitionConfigUseCase {
  constructor(private tuitionConfigRepository: ITuitionConfigRepository) { }

  async execute(input: CreateTuitionConfigInput, schoolId: string): Promise<TuitionConfig> {
    const existing = await this.tuitionConfigRepository.findBySchoolId(schoolId);
    if (existing) {
      throw new Error('Tuition configuration already exists for this school. Use update instead.');
    }

    const tuitionConfig = TuitionConfig.create({
      id: randomUUID(),
      schoolId,
      dueDay: input.dueDay,
    });

    return await this.tuitionConfigRepository.create(tuitionConfig);
  }
}

