import { IStudentRepository } from '../../../adapters_interface/repositories';
import { Student } from '../../../domain/entities';
import prisma from '../prisma.client';
import { StudentMapper } from '../mappers';

export class StudentRepository implements IStudentRepository {
  async findById(id: string, schoolId: string): Promise<Student | null> {
    const student = await prisma.student.findFirst({
      where: { 
        id,
        schoolId, // Ensure tenant isolation
        deletedAt: null, // Soft delete filter
      },
      include: {
        user: true, // Student's user account
        userStudents: {
          include: {
            user: true, // Parent users
          },
        },
        certificationType: true,
      },
    });

    return student ? StudentMapper.toDomain(student) : null;
  }

  async findBySchoolId(schoolId: string): Promise<Student[]> {
    const students = await prisma.student.findMany({
      where: { 
        schoolId,
        deletedAt: null, // Soft delete filter
      },
      include: {
        user: true, // Student's user account
        userStudents: {
          include: {
            user: true, // Parent users
          },
        },
        certificationType: true,
      },
      orderBy: { 
        user: {
          lastName: 'asc',
        },
      },
    });

    return students.map(StudentMapper.toDomain);
  }

  async create(student: Student): Promise<Student> {
    // This is now handled by CreateStudentUseCase which creates User first
    throw new Error('Use CreateStudentUseCase instead - it creates User and Student together');
  }

  async createWithUser(student: Student, userId: string): Promise<Student> {
    const created = await prisma.student.create({
      data: {
        userId,
        birthDate: student.birthDate,
        certificationTypeId: student.certificationTypeId,
        graduationDate: student.graduationDate,
        contactPhone: student.contactPhone || null,
        schoolId: student.schoolId,
        isLeveled: student.isLeveled,
        expectedLevel: student.expectedLevel || null,
        currentLevel: student.currentLevel || null,
        address: student.address || null,
      },
      include: {
        user: true,
        userStudents: {
          include: {
            user: true,
          },
        },
        certificationType: true,
      },
    });

    return StudentMapper.toDomain(created);
  }

  async update(id: string, data: Partial<Student>, schoolId: string): Promise<Student> {
    // First check if student exists and belongs to school
    const existing = await this.findById(id, schoolId);
    if (!existing) {
      throw new Error('Student not found');
    }

    // Update student record
    const updated = await prisma.student.update({
      where: { id },
      data: {
        birthDate: data.birthDate,
        certificationTypeId: data.certificationTypeId,
        graduationDate: data.graduationDate,
        contactPhone: data.contactPhone || undefined,
        isLeveled: data.isLeveled,
        expectedLevel: data.expectedLevel || undefined,
        currentLevel: data.currentLevel || undefined,
        address: data.address || undefined,
      },
      include: {
        user: true,
        userStudents: {
          include: {
            user: true,
          },
        },
        certificationType: true,
      },
    });

    return StudentMapper.toDomain(updated);
  }

  async delete(id: string, schoolId: string): Promise<void> {
    // First check if student exists and belongs to school
    const existing = await this.findById(id, schoolId);
    if (!existing) {
      throw new Error('Student not found');
    }

    // Soft delete
    await prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

