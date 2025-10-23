import { ISchoolRepository } from '../../../adapters_interface/repositories';

export class DeleteSchoolUseCase {
  constructor(private schoolRepository: ISchoolRepository) {}

  async execute(schoolId: string): Promise<void> {
    const existingSchool = await this.schoolRepository.findById(schoolId);

    if (!existingSchool) {
      throw new Error('School not found');
    }

    return this.schoolRepository.delete(schoolId);
  }
}

