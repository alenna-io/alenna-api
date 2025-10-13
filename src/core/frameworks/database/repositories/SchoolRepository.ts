import { ISchoolRepository } from '../../../adapters_interface/repositories';
import { School } from '../../../domain/entities';
import prisma from '../prisma.client';
import { SchoolMapper } from '../mappers';

export class SchoolRepository implements ISchoolRepository {
  async findById(id: string): Promise<School | null> {
    const school = await prisma.school.findUnique({
      where: { id },
    });

    return school ? SchoolMapper.toDomain(school) : null;
  }

  async findAll(): Promise<School[]> {
    const schools = await prisma.school.findMany({
      orderBy: { name: 'asc' },
    });

    return schools.map(SchoolMapper.toDomain);
  }

  async create(school: School): Promise<School> {
    const created = await prisma.school.create({
      data: {
        name: school.name,
        address: school.address || null,
        phone: school.phone || null,
        email: school.email || null,
      },
    });

    return SchoolMapper.toDomain(created);
  }

  async update(id: string, data: Partial<School>): Promise<School> {
    const updated = await prisma.school.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
      },
    });

    return SchoolMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.school.delete({
      where: { id },
    });
  }
}

