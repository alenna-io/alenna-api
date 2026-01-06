import { SchoolYearRepository } from '../../../../adapters_interface/repositories/v2';
import { SchoolYear } from '../../../../domain/entities/v2/SchoolYear';
import { SchoolYearMapper } from '../../mappers/v2/SchoolYearMapper';
import prisma from '../../prisma.client';
import { PrismaTransaction } from '../../PrismaTransaction';

export class PrismaSchoolYearRepository implements SchoolYearRepository {
  async findById(id: string, tx: PrismaTransaction = prisma): Promise<SchoolYear | null> {
    const schoolYear = await tx.schoolYear.findUnique({
      where: { id },
    });
    return schoolYear ? SchoolYearMapper.toDomain(schoolYear) : null;
  }
}