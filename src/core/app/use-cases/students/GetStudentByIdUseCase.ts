import { IStudentRepository } from '../../../adapters_interface/repositories';
import { Student } from '../../../domain/entities';

export class GetStudentByIdUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(studentId: string, schoolId: string): Promise<Student> {
    const student = await this.studentRepository.findById(studentId, schoolId);

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }
}

