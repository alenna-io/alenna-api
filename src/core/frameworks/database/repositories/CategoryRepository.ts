import { ICategoryRepository } from '../../../adapters_interface/repositories';
import { Category } from '../../../domain/entities';
import { CategoryMapper } from '../mappers';
import { randomUUID } from 'crypto';
import prisma from '../prisma.client';

export class CategoryRepository implements ICategoryRepository {
  async findById(id: string): Promise<Category | null> {
    const category = await prisma.category.findUnique({
      where: { id },
    });
    return category ? CategoryMapper.toDomain(category) : null;
  }

  async findByIdWithSubSubjects(id: string): Promise<Category | null> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        subSubjects: true,
      },
    });
    return category ? CategoryMapper.toDomain(category) : null;
  }

  async findAll(): Promise<Category[]> {
    const categories = await prisma.category.findMany();
    return categories.map(CategoryMapper.toDomain);
  }

  async findAllWithSubSubjects(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      include: {
        subSubjects: true,
      },
    });
    return categories.map(CategoryMapper.toDomain);
  }

  async create(category: Category): Promise<Category> {
    const created = await prisma.category.create({
      data: {
        id: randomUUID(),
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder,
      },
    });
    return CategoryMapper.toDomain(created);
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    const updated = await prisma.category.update({
      where: { id },
      data: category,
    });
    return CategoryMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.category.delete({
      where: { id },
    });
  }
}