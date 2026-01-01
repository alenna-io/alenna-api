import { TuitionConfig as PrismaTuitionConfig } from '@prisma/client';
import { TuitionConfig } from '../../../domain/entities';

export class TuitionConfigMapper {
  static toDomain(prismaConfig: PrismaTuitionConfig): TuitionConfig {
    return new TuitionConfig(
      prismaConfig.id,
      prismaConfig.schoolId,
      prismaConfig.dueDay,
      prismaConfig.createdAt,
      prismaConfig.updatedAt
    );
  }

  static toPrisma(tuitionConfig: TuitionConfig): Omit<PrismaTuitionConfig, 'createdAt' | 'updatedAt'> {
    return {
      id: tuitionConfig.id,
      schoolId: tuitionConfig.schoolId,
      dueDay: tuitionConfig.dueDay,
    };
  }
}

