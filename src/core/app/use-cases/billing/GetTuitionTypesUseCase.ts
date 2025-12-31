import { ITuitionTypeRepository } from '../../../adapters_interface/repositories';
import { TuitionType } from '../../../domain/entities';

export class GetTuitionTypesUseCase {
  constructor(private tuitionTypeRepository: ITuitionTypeRepository) {}

  async execute(schoolId: string): Promise<TuitionType[]> {
    return await this.tuitionTypeRepository.findBySchoolId(schoolId);
  }
}

