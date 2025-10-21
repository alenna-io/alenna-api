import { SubSubject } from '../../../domain/entities';
import { SubSubject as PrismaSubSubject } from '@prisma/client';

export class SubSubjectMapper {
  static toDomain(subSubject: PrismaSubSubject): SubSubject {
    return new SubSubject(
      subSubject.id,
      subSubject.name,
      subSubject.categoryId,
      subSubject.levelId,
      subSubject.difficulty,
      subSubject.createdAt,
      subSubject.updatedAt
    );
  }
}

