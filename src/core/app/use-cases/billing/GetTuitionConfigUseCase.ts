import { ITuitionConfigRepository } from '../../../adapters_interface/repositories';
import { TuitionConfig } from '../../../domain/entities';

export class GetTuitionConfigUseCase {
  constructor(private tuitionConfigRepository: ITuitionConfigRepository) {}

  async execute(schoolId: string): Promise<TuitionConfig | null> {
    return await this.tuitionConfigRepository.findBySchoolId(schoolId);
  }
}

