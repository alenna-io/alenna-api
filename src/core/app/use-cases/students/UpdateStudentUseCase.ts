import { IStudentRepository } from '../../../adapters_interface/repositories';
import { Student } from '../../../domain/entities';
import { UpdateStudentInput } from '../../dtos';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Get student's userId
    const studentRecord = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });

    if (!studentRecord) {
      throw new Error('Student record not found');
    }

    // Update User if firstName or lastName changed
    if (input.firstName || input.lastName) {
      await prisma.user.update({
        where: { id: studentRecord.userId },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
        },
      });
    }

    // Prepare update data for Student
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

