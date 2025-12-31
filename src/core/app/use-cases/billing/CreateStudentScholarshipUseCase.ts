import { IStudentScholarshipRepository } from '../../../adapters_interface/repositories';
import { StudentScholarship } from '../../../domain/entities';
import { CreateStudentScholarshipInput } from '../../dtos';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CreateStudentScholarshipUseCase {
  constructor(private studentScholarshipRepository: IStudentScholarshipRepository) { }

  async execute(input: CreateStudentScholarshipInput, studentId: string, schoolId: string): Promise<StudentScholarship> {
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId,
        deletedAt: null,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const existing = await this.studentScholarshipRepository.findByStudentId(studentId, schoolId);
    if (existing) {
      throw new Error('Scholarship already exists for this student. Use update instead.');
    }

    if (input.scholarshipType === 'percentage' && input.scholarshipValue !== null && input.scholarshipValue !== undefined && (input.scholarshipValue < 0 || input.scholarshipValue > 100)) {
      throw new Error('Percentage scholarship must be between 0 and 100');
    }

    if (input.scholarshipType === 'fixed' && input.scholarshipValue !== null && input.scholarshipValue !== undefined && input.scholarshipValue < 0) {
      throw new Error('Fixed scholarship amount cannot be negative');
    }

    const scholarship = StudentScholarship.create({
      id: randomUUID(),
      studentId,
      tuitionTypeId: input.tuitionTypeId ?? null,
      scholarshipType: input.scholarshipType ?? null,
      scholarshipValue: input.scholarshipValue ?? null,
    });

    return await this.studentScholarshipRepository.create(scholarship);
  }
}

