import { ITuitionConfigRepository } from '../../../adapters_interface/repositories';
import { TuitionConfig } from '../../../domain/entities';
import { UpdateTuitionConfigInput } from '../../dtos';

export class UpdateTuitionConfigUseCase {
  constructor(private tuitionConfigRepository: ITuitionConfigRepository) {}

  async execute(id: string, input: UpdateTuitionConfigInput, schoolId: string): Promise<TuitionConfig> {
    const existing = await this.tuitionConfigRepository.findBySchoolId(schoolId);
    if (!existing) {
      throw new Error('Tuition configuration not found');
    }

    if (id !== existing.id) {
      throw new Error('Tuition configuration ID mismatch');
    }

    const updatedConfig = existing.update(input);
    return await this.tuitionConfigRepository.update(id, updatedConfig, schoolId);
  }
}

