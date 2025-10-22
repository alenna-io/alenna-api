import { IRoleRepository } from '../../../adapters_interface/repositories';
import { Role } from '../../../domain/entities';
import prisma from '../prisma.client';
import { RoleMapper } from '../mappers';

export class RoleRepository implements IRoleRepository {
  async findAll(): Promise<Role[]> {
    const roles = await prisma.role.findMany({
      where: { 
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    return roles.map(RoleMapper.toDomain);
  }

  async findById(id: string): Promise<Role | null> {
    const role = await prisma.role.findUnique({
      where: { id },
    });

    return role ? RoleMapper.toDomain(role) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const role = await prisma.role.findFirst({
      where: { name },
    });

    return role ? RoleMapper.toDomain(role) : null;
  }

  async create(role: Role): Promise<Role> {
    const created = await prisma.role.create({
      data: {
        name: role.name,
        displayName: role.displayName,
        description: role.description || null,
        isSystem: role.isSystem,
        isActive: role.isActive,
        schoolId: role.schoolId || null,
      },
    });

    return RoleMapper.toDomain(created);
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    const updated = await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description || undefined,
        isSystem: data.isSystem,
        isActive: data.isActive,
        schoolId: data.schoolId || undefined,
      },
    });

    return RoleMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    // Soft delete - set isActive to false
    await prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
