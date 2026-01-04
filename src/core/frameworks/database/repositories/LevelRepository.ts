import { ILevelRepository } from '../../../adapters_interface/repositories';
import { Level } from '../../../domain/entities';
import { LevelMapper } from '../mappers';
import { randomUUID } from 'crypto';
import prisma from '../prisma.client';

export class LevelRepository implements ILevelRepository {
  async findById(id: string): Promise<Level | null> {
    const level = await prisma.level.findUnique({
      where: { id },
    });
    return level ? LevelMapper.toDomain(level) : null;
  }
  async findByIdWithSubSubjects(id: string): Promise<Level | null> {
    const level = await prisma.level.findUnique({
      where: { id },
      include: {
        subSubjects: true,
      },
    });
    return level ? LevelMapper.toDomain(level) : null;
  }
  async findAll(): Promise<Level[]> {
    const levels = await prisma.level.findMany();
    return levels.map(LevelMapper.toDomain);
  }
  async findAllWithSubSubjects(): Promise<Level[]> {
    const levels = await prisma.level.findMany({
      include: {
        subSubjects: true,
      },
    });
    return levels.map(LevelMapper.toDomain);
  }
  async create(level: Level): Promise<Level> {
    const created = await prisma.level.create({
      data: {
        id: randomUUID(),
        number: level.number,
        name: level.name,
      },
    });
    return LevelMapper.toDomain(created);
  }
  async update(id: string, level: Partial<Level>): Promise<Level> {
    const updated = await prisma.level.update({
      where: { id },
      data: {
        id: id,
        number: level.number,
        name: level.name || undefined,
      },
    });
    return LevelMapper.toDomain(updated);
  }
  async delete(id: string): Promise<void> {
    await prisma.level.delete({
      where: { id },
    });
  }
}