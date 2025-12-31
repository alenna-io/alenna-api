import { TuitionType as PrismaTuitionType } from '@prisma/client';
import { TuitionType } from '../../../domain/entities';
import { Decimal } from '@prisma/client/runtime/library';

export class TuitionTypeMapper {
  static toDomain(prismaTuitionType: PrismaTuitionType): TuitionType {
    return new TuitionType(
      prismaTuitionType.id,
      prismaTuitionType.schoolId,
      prismaTuitionType.name,
      Number(prismaTuitionType.baseAmount),
      prismaTuitionType.currency,
      prismaTuitionType.lateFeeType as 'fixed' | 'percentage',
      Number(prismaTuitionType.lateFeeValue),
      prismaTuitionType.displayOrder,
      prismaTuitionType.createdAt,
      prismaTuitionType.updatedAt
    );
  }

  static toPrisma(tuitionType: TuitionType): Omit<PrismaTuitionType, 'createdAt' | 'updatedAt'> {
    return {
      id: tuitionType.id,
      schoolId: tuitionType.schoolId,
      name: tuitionType.name,
      baseAmount: new Decimal(tuitionType.baseAmount),
      currency: tuitionType.currency,
      lateFeeType: tuitionType.lateFeeType,
      lateFeeValue: new Decimal(tuitionType.lateFeeValue),
      displayOrder: tuitionType.displayOrder,
    };
  }
}

