import { Category } from '../../../domain/entities';
import { Category as PrismaCategory } from '@prisma/client';

export class CategoryMapper {
  static toDomain(category: PrismaCategory): Category {
    return new Category(
      category.id,
      category.name,
      category.description ?? undefined,
      category.displayOrder,
      category.createdAt,
      category.updatedAt
    );
  }
}

