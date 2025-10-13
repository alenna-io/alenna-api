import { IStudentRepository } from '../../../adapters_interface/repositories';

export class DeleteStudentUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(studentId: string, schoolId: string): Promise<void> {
    // Check if student exists and belongs to school
    const student = await this.studentRepository.findById(studentId, schoolId);

    if (!student) {
      throw new Error('Student not found');
    }

    return this.studentRepository.delete(studentId, schoolId);
  }
}

