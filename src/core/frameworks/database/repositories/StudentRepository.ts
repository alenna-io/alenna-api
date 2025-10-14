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
      },
      include: {
        parents: true,
        certificationType: true,
      },
    });

    return student ? StudentMapper.toDomain(student) : null;
  }

  async findBySchoolId(schoolId: string): Promise<Student[]> {
    const students = await prisma.student.findMany({
      where: { schoolId },
      include: {
        parents: true,
        certificationType: true,
      },
      orderBy: { lastName: 'asc' },
    });

    return students.map(StudentMapper.toDomain);
  }

  async create(student: Student): Promise<Student> {
    const created = await prisma.student.create({
      data: {
        firstName: student.firstName,
        lastName: student.lastName,
        age: student.age,
        birthDate: student.birthDate,
        certificationTypeId: student.certificationTypeId,
        graduationDate: student.graduationDate,
        schoolId: student.schoolId,
        contactPhone: student.contactPhone || null,
        isLeveled: student.isLeveled,
        expectedLevel: student.expectedLevel || null,
        address: student.address || null,
        parents: student.parents.length > 0 ? {
          create: student.parents.map(p => ({ name: p.name })),
        } : undefined,
      },
      include: {
        parents: true,
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

    const updated = await prisma.student.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        age: data.age,
        birthDate: data.birthDate,
        certificationTypeId: data.certificationTypeId,
        graduationDate: data.graduationDate,
        contactPhone: data.contactPhone || undefined,
        isLeveled: data.isLeveled,
        expectedLevel: data.expectedLevel || undefined,
        address: data.address || undefined,
      },
      include: {
        parents: true,
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

    await prisma.student.delete({
      where: { id },
    });
  }
}

