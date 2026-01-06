import { StudentRepository } from '../../../../adapters_interface/repositories/v2/StudentRepository';
import { Student } from '../../../../domain/entities/v2/Student';
import { StudentMapper } from '../../mappers/v2/StudentMapper';
import prisma from '../../prisma.client';
import { PrismaTransaction } from '../../PrismaTransaction';

export class PrismaStudentRepository implements StudentRepository {
  async findById(id: string, tx: PrismaTransaction = prisma): Promise<Student | null> {
    const student = await tx.student.findUnique({
      where: {
        id,
      },
    })
    return student ? StudentMapper.toDomain(student) : null
  }
}