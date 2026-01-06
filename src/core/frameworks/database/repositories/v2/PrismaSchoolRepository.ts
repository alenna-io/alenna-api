import { SchoolRepository } from '../../../../adapters_interface/repositories/v2';
import { School } from '../../../../domain/entities/v2/School';
import { SchoolMapper } from '../../mappers/v2/SchoolMapper';
import prisma from '../../prisma.client';
import { PrismaTransaction } from '../../PrismaTransaction';

export class PrismaSchoolRepository implements SchoolRepository {
  async findById(id: string, tx: PrismaTransaction = prisma): Promise<School | null> {
    const school = await tx.school.findUnique({
      where: { id },
    });
    return school ? SchoolMapper.toDomain(school) : null;
  }
}