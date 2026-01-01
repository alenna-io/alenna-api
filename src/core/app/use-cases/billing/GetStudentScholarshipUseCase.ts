import { IStudentScholarshipRepository } from '../../../adapters_interface/repositories';
import { StudentScholarship } from '../../../domain/entities';

export class GetStudentScholarshipUseCase {
  constructor(private studentScholarshipRepository: IStudentScholarshipRepository) {}

  async execute(studentId: string, schoolId: string): Promise<StudentScholarship | null> {
    return await this.studentScholarshipRepository.findByStudentId(studentId, schoolId);
  }
}

