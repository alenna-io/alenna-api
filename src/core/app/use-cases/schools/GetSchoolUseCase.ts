import { ISchoolRepository } from '../../../adapters_interface/repositories';
import { School } from '../../../domain/entities';

export class GetSchoolUseCase {
  constructor(private schoolRepository: ISchoolRepository) {}

  async execute(schoolId: string): Promise<School> {
    const school = await this.schoolRepository.findById(schoolId);

    if (!school) {
      throw new Error('School not found');
    }

    return school;
  }
}

