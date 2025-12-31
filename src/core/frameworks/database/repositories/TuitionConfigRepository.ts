import { ITuitionConfigRepository } from '../../../adapters_interface/repositories';
import { TuitionConfig } from '../../../domain/entities';
import prisma from '../prisma.client';
import { TuitionConfigMapper } from '../mappers';

export class TuitionConfigRepository implements ITuitionConfigRepository {
  async findBySchoolId(schoolId: string): Promise<TuitionConfig | null> {
    const config = await prisma.tuitionConfig.findUnique({
      where: { schoolId },
    });

    return config ? TuitionConfigMapper.toDomain(config) : null;
  }

  async create(tuitionConfig: TuitionConfig): Promise<TuitionConfig> {
    const created = await prisma.tuitionConfig.create({
      data: TuitionConfigMapper.toPrisma(tuitionConfig),
    });

    return TuitionConfigMapper.toDomain(created);
  }

  async update(id: string, tuitionConfig: Partial<TuitionConfig>, schoolId: string): Promise<TuitionConfig> {
    const existing = await prisma.tuitionConfig.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      throw new Error('Tuition config not found');
    }

    const updateData: any = {};
    if (tuitionConfig.dueDay !== undefined) {
      updateData.dueDay = tuitionConfig.dueDay;
    }

    const updated = await prisma.tuitionConfig.update({
      where: { id },
      data: updateData,
    });

    return TuitionConfigMapper.toDomain(updated);
  }

  async delete(id: string, schoolId: string): Promise<void> {
    const existing = await prisma.tuitionConfig.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      throw new Error('Tuition config not found');
    }

    await prisma.tuitionConfig.delete({
      where: { id },
    });
  }
}

