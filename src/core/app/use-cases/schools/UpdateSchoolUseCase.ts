import { ISchoolRepository } from '../../../adapters_interface/repositories';
import { School } from '../../../domain/entities';
import { UpdateSchoolInput } from '../../dtos';

export class UpdateSchoolUseCase {
  constructor(private schoolRepository: ISchoolRepository) {}

  async execute(schoolId: string, input: UpdateSchoolInput): Promise<School> {
    const existingSchool = await this.schoolRepository.findById(schoolId);

    if (!existingSchool) {
      throw new Error('School not found');
    }

    return this.schoolRepository.update(schoolId, input);
  }
}

