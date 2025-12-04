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

    // Update User if firstName, lastName, or contact info changed
    const userUpdateData: any = {};
    if (input.firstName !== undefined) userUpdateData.firstName = input.firstName;
    if (input.lastName !== undefined) userUpdateData.lastName = input.lastName;
    if (input.phone !== undefined) userUpdateData.phone = input.phone || null;
    if (input.streetAddress !== undefined) userUpdateData.streetAddress = input.streetAddress || null;
    if (input.city !== undefined) userUpdateData.city = input.city || null;
    if (input.state !== undefined) userUpdateData.state = input.state || null;
    if (input.country !== undefined) userUpdateData.country = input.country || null;
    if (input.zipCode !== undefined) userUpdateData.zipCode = input.zipCode || null;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: studentRecord.userId },
        data: userUpdateData,
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

