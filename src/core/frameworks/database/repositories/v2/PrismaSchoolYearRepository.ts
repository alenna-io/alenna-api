import { SchoolYearRepository } from '../../../../adapters_interface/repositories/v2';
import { SchoolYear } from '../../../../domain/entities/v2/SchoolYear';
import { SchoolYearMapper } from '../../mappers/v2/SchoolYearMapper';
import prisma from '../../prisma.client';

export class PrismaSchoolYearRepository implements SchoolYearRepository {
  async findById(id: string): Promise<SchoolYear | null> {
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { id },
    });
    return schoolYear ? SchoolYearMapper.toDomain(schoolYear) : null;
  }
}