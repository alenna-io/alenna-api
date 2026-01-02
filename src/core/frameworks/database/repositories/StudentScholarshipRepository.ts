import { IStudentScholarshipRepository } from '../../../adapters_interface/repositories';
import { StudentScholarship } from '../../../domain/entities';
import prisma from '../prisma.client';
import { StudentScholarshipMapper } from '../mappers';

export class StudentScholarshipRepository implements IStudentScholarshipRepository {
  async findByStudentId(studentId: string, schoolId: string): Promise<StudentScholarship | null> {
    const scholarship = await prisma.studentScholarship.findFirst({
      where: {
        studentId,
        student: {
          schoolId,
          deletedAt: null,
        },
      },
    });

    return scholarship ? StudentScholarshipMapper.toDomain(scholarship) : null;
  }

  async create(scholarship: StudentScholarship): Promise<StudentScholarship> {
    const created = await prisma.studentScholarship.create({
      data: StudentScholarshipMapper.toPrisma(scholarship),
    });

    return StudentScholarshipMapper.toDomain(created);
  }

  async update(id: string, scholarship: Partial<StudentScholarship>, schoolId: string): Promise<StudentScholarship> {
    const existing = await prisma.studentScholarship.findFirst({
      where: {
        id,
        student: {
          schoolId,
          deletedAt: null,
        },
      },
    });

    if (!existing) {
      throw new Error('Student scholarship not found');
    }

    const updateData: any = {};
    if (scholarship.tuitionTypeId !== undefined) {
      updateData.tuitionTypeId = scholarship.tuitionTypeId;
    }
    if (scholarship.scholarshipType !== undefined) {
      updateData.scholarshipType = scholarship.scholarshipType;
    }
    if (scholarship.scholarshipValue !== undefined) {
      updateData.scholarshipValue = scholarship.scholarshipValue;
    }
    if (scholarship.taxableBillRequired !== undefined) {
      updateData.taxableBillRequired = scholarship.taxableBillRequired;
    }

    const updated = await prisma.studentScholarship.update({
      where: { id },
      data: updateData,
    });

    return StudentScholarshipMapper.toDomain(updated);
  }

  async delete(id: string, schoolId: string): Promise<void> {
    const existing = await prisma.studentScholarship.findFirst({
      where: {
        id,
        student: {
          schoolId,
          deletedAt: null,
        },
      },
    });

    if (!existing) {
      throw new Error('Student scholarship not found');
    }

    await prisma.studentScholarship.delete({
      where: { id },
    });
  }
}

