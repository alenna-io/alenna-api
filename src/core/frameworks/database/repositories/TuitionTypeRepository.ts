import { ITuitionTypeRepository } from '../../../adapters_interface/repositories';
import { TuitionType } from '../../../domain/entities';
import prisma from '../prisma.client';
import { TuitionTypeMapper } from '../mappers';

export class TuitionTypeRepository implements ITuitionTypeRepository {
  async findById(id: string, schoolId: string): Promise<TuitionType | null> {
    const tuitionType = await prisma.tuitionType.findFirst({
      where: { id, schoolId },
    });

    return tuitionType ? TuitionTypeMapper.toDomain(tuitionType) : null;
  }

  async findBySchoolId(schoolId: string): Promise<TuitionType[]> {
    const tuitionTypes = await prisma.tuitionType.findMany({
      where: { schoolId },
      orderBy: { displayOrder: 'asc' },
    });

    return tuitionTypes.map(TuitionTypeMapper.toDomain);
  }

  async create(tuitionType: TuitionType): Promise<TuitionType> {
    const created = await prisma.tuitionType.create({
      data: TuitionTypeMapper.toPrisma(tuitionType),
    });

    return TuitionTypeMapper.toDomain(created);
  }

  async update(id: string, tuitionType: Partial<TuitionType>, schoolId: string): Promise<TuitionType> {
    const existing = await prisma.tuitionType.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      throw new Error('Tuition type not found');
    }

    const updateData: any = {};
    if (tuitionType.name !== undefined) {
      updateData.name = tuitionType.name;
    }
    if (tuitionType.baseAmount !== undefined) {
      updateData.baseAmount = tuitionType.baseAmount;
    }
    if (tuitionType.currency !== undefined) {
      updateData.currency = tuitionType.currency;
    }
    if (tuitionType.lateFeeType !== undefined) {
      updateData.lateFeeType = tuitionType.lateFeeType;
    }
    if (tuitionType.lateFeeValue !== undefined) {
      updateData.lateFeeValue = tuitionType.lateFeeValue;
    }
    if (tuitionType.displayOrder !== undefined) {
      updateData.displayOrder = tuitionType.displayOrder;
    }

    const updated = await prisma.tuitionType.update({
      where: { id },
      data: updateData,
    });

    return TuitionTypeMapper.toDomain(updated);
  }

  async delete(id: string, schoolId: string): Promise<void> {
    const existing = await prisma.tuitionType.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      throw new Error('Tuition type not found');
    }

    await prisma.tuitionType.delete({
      where: { id },
    });
  }
}

