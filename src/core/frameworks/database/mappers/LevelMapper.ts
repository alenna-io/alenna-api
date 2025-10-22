import { Level } from '../../../domain/entities';
import { Level as PrismaLevel } from '@prisma/client';

export class LevelMapper {
  static toDomain(level: PrismaLevel): Level {
    return new Level(
      level.id,
      level.number,
      level.name,
      level.createdAt,
      level.updatedAt
    );
  }
}

