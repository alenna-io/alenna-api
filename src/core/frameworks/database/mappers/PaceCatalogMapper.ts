import { PaceCatalog } from '../../../domain/entities';
import {
  PaceCatalog as PrismaPaceCatalog,
  SubSubject as PrismaSubSubject
} from '@prisma/client';
import { SubSubjectMapper } from './';

export class PaceCatalogMapper {
  static toDomain(
    paceCatalog: PrismaPaceCatalog,
    subSubject: PrismaSubSubject | null = null
  ): PaceCatalog {
    return new PaceCatalog(
      paceCatalog.id,
      paceCatalog.code,
      paceCatalog.name,
      paceCatalog.subSubjectId,
      paceCatalog.createdAt,
      paceCatalog.updatedAt,
      subSubject ? SubSubjectMapper.toDomain(subSubject) : undefined
    );
  }
  static toPrisma(paceCatalog: PaceCatalog): Omit<PrismaPaceCatalog, 'createdAt' | 'updatedAt'> {
    return {
      id: paceCatalog.id,
      code: paceCatalog.code,
      name: paceCatalog.name,
      subSubjectId: paceCatalog.subSubjectId,
    };
  }
}

