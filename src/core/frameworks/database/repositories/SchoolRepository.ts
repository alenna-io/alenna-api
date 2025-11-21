import { ISchoolRepository } from '../../../adapters_interface/repositories';
import { School } from '../../../domain/entities';
import prisma from '../prisma.client';
import { SchoolMapper } from '../mappers';

export class SchoolRepository implements ISchoolRepository {
  async findById(id: string): Promise<School | null> {
    const school = await prisma.school.findFirst({
      where: { 
        id,
        deletedAt: null, // Soft delete filter
      },
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
        teacherLimit: school.teacherLimit || null,
        userLimit: school.userLimit || null,
        isActive: school.isActive ?? true,
      },
    });

    return SchoolMapper.toDomain(created);
  }

  async update(id: string, data: Partial<School>): Promise<School> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.teacherLimit !== undefined) updateData.teacherLimit = data.teacherLimit || null;
    if (data.userLimit !== undefined) updateData.userLimit = data.userLimit || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.school.update({
      where: { id },
      data: updateData,
    });

    return SchoolMapper.toDomain(updated);
  }

  async activate(id: string): Promise<School> {
    const updated = await prisma.school.update({
      where: { id },
      data: { isActive: true },
    });

    return SchoolMapper.toDomain(updated);
  }

  async deactivate(id: string): Promise<School> {
    const updated = await prisma.school.update({
      where: { id },
      data: { isActive: false },
    });

    return SchoolMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.school.delete({
      where: { id },
    });
  }
}

