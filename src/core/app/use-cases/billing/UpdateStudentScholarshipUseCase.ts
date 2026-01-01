import { IStudentScholarshipRepository } from '../../../adapters_interface/repositories';
import { StudentScholarship } from '../../../domain/entities';
import { UpdateStudentScholarshipInput } from '../../dtos';

export class UpdateStudentScholarshipUseCase {
  constructor(private studentScholarshipRepository: IStudentScholarshipRepository) { }

  async execute(studentId: string, input: UpdateStudentScholarshipInput, schoolId: string): Promise<StudentScholarship> {
    const existing = await this.studentScholarshipRepository.findByStudentId(studentId, schoolId);
    if (!existing) {
      throw new Error('Student scholarship not found');
    }

    if (input.scholarshipType === 'percentage' && input.scholarshipValue !== null && input.scholarshipValue !== undefined && (input.scholarshipValue < 0 || input.scholarshipValue > 100)) {
      throw new Error('Percentage scholarship must be between 0 and 100');
    }

    if (input.scholarshipType === 'fixed' && input.scholarshipValue !== null && input.scholarshipValue !== undefined && input.scholarshipValue < 0) {
      throw new Error('Fixed scholarship amount cannot be negative');
    }


    const updatedScholarship = existing.update(input);
    return await this.studentScholarshipRepository.update(existing.id, updatedScholarship, schoolId);
  }
}

