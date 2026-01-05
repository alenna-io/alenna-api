import { StudentRepository } from '../../../../adapters_interface/repositories/v2/StudentRepository';
import { Student } from '../../../../domain/entities/v2/Student';
import { StudentMapper } from '../../mappers/v2/StudentMapper';
import prisma from '../../prisma.client';

export class PrismaStudentRepository implements StudentRepository {
  async findById(id: string): Promise<Student | null> {
    const student = await prisma.student.findUnique({
      where: {
        id,
      },
    })
    return student ? StudentMapper.toDomain(student) : null
  }
}