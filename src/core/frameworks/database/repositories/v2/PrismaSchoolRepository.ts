import { SchoolRepository } from '../../../../adapters_interface/repositories/v2';
import { School } from '../../../../domain/entities/v2/School';
import { SchoolMapper } from '../../mappers/v2/SchoolMapper';
import prisma from '../../prisma.client';

export class PrismaSchoolRepository implements SchoolRepository {
  async findById(id: string): Promise<School | null> {
    const school = await prisma.school.findUnique({
      where: { id },
    });
    return school ? SchoolMapper.toDomain(school) : null;
  }
}