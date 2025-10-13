import { IStudentRepository } from '../../../adapters_interface/repositories';
import { Student } from '../../../domain/entities';

export class GetStudentsUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(schoolId: string): Promise<Student[]> {
    return this.studentRepository.findBySchoolId(schoolId);
  }
}

