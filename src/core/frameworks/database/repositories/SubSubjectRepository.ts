import { ISubSubjectRepository } from '../../../adapters_interface/repositories';
import { SubSubject } from '../../../domain/entities';
import { SubSubjectMapper } from '../mappers';
import { randomUUID } from 'crypto';
import prisma from '../prisma.client';

export class SubSubjectRepository implements ISubSubjectRepository {
  async findById(id: string): Promise<SubSubject | null> {
    const subSubject = await prisma.subSubject.findUnique({
      where: { id },
    });
    return subSubject ? SubSubjectMapper.toDomain(subSubject) : null;
  }

  async findBySubjectNameAndCategoryId(name: string, categoryId: string): Promise<SubSubject | null> {
    const subSubject = await prisma.subSubject.findFirst({
      where: { name: name, categoryId: categoryId },
    });
    return subSubject ? SubSubjectMapper.toDomain(subSubject) : null;
  }

  async findByIdWithPaces(id: string): Promise<SubSubject | null> {
    const subSubject = await prisma.subSubject.findUnique({
      where: { id },
      include: {
        paces: true,
      },
    });
    return subSubject ? SubSubjectMapper.toDomain(subSubject) : null;
  }

  async findAllByCategoryId(categoryId: string): Promise<SubSubject[]> {
    const subSubjects = await prisma.subSubject.findMany({
      where: { categoryId },
      include: {
        paces: true,
      },
    });
    return subSubjects.map(SubSubjectMapper.toDomain);
  }

  async findAllByLevelId(levelId: string): Promise<SubSubject[]> {
    const subSubjects = await prisma.subSubject.findMany({
      where: { levelId },
    });
    return subSubjects.map(SubSubjectMapper.toDomain);
  }

  async findAll(): Promise<SubSubject[]> {
    const subSubjects = await prisma.subSubject.findMany();
    return subSubjects.map(SubSubjectMapper.toDomain);
  }

  async create(subSubject: SubSubject): Promise<SubSubject> {
    const created = await prisma.subSubject.create({
      data: {
        id: randomUUID(),
        name: subSubject.name,
        difficulty: subSubject.difficulty,
        categoryId: subSubject.categoryId,
        levelId: subSubject.levelId,
      },
    });
    return SubSubjectMapper.toDomain(created);
  }

  async update(id: string, subSubject: Partial<SubSubject>): Promise<SubSubject> {
    const updated = await prisma.subSubject.update({
      where: { id },
      data: subSubject,
    });
    return SubSubjectMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.subSubject.delete({
      where: { id },
    });
  }
}