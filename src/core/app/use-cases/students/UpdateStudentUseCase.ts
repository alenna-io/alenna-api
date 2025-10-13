import { IStudentRepository } from '../../../adapters_interface/repositories';
import { Student } from '../../../domain/entities';
import { UpdateStudentInput } from '../../dtos';

export class UpdateStudentUseCase {
  constructor(private studentRepository: IStudentRepository) {}

  async execute(
    studentId: string,
    input: UpdateStudentInput,
    schoolId: string
  ): Promise<Student> {
    // Check if student exists and belongs to school
    const existingStudent = await this.studentRepository.findById(studentId, schoolId);

    if (!existingStudent) {
      throw new Error('Student not found');
    }

    // Prepare update data
    const updateData: any = { ...input };
    if (input.birthDate) {
      updateData.birthDate = new Date(input.birthDate);
    }
    if (input.graduationDate) {
      updateData.graduationDate = new Date(input.graduationDate);
    }

    return this.studentRepository.update(studentId, updateData, schoolId);
  }
}

