import { RecurringExtraCharge } from '../../../domain/entities';
import { IRecurringExtraChargeRepository } from '../../../adapters_interface/repositories';
import prisma from '../prisma.client';

export class RecurringExtraChargeRepository implements IRecurringExtraChargeRepository {
  async create(charge: RecurringExtraCharge): Promise<RecurringExtraCharge> {
    const created = await prisma.recurringExtraCharge.create({
      data: {
        id: charge.id,
        studentId: charge.studentId,
        description: charge.description,
        amount: charge.amount,
        expiresAt: charge.expiresAt,
        createdAt: charge.createdAt,
        updatedAt: charge.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async update(id: string, charge: Partial<RecurringExtraCharge>): Promise<RecurringExtraCharge> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (charge.description !== undefined) updateData.description = charge.description;
    if (charge.amount !== undefined) updateData.amount = charge.amount;
    if (charge.expiresAt !== undefined) updateData.expiresAt = charge.expiresAt;
    if (charge.deletedAt !== undefined) updateData.deletedAt = charge.deletedAt;

    const updated = await prisma.recurringExtraCharge.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(updated);
  }

  async findById(id: string, schoolId: string): Promise<RecurringExtraCharge | null> {
    const charge = await prisma.recurringExtraCharge.findFirst({
      where: {
        id,
        deletedAt: null,
        student: {
          schoolId,
        },
      },
    });

    return charge ? this.toDomain(charge) : null;
  }

  async findActiveBySchoolId(schoolId: string): Promise<RecurringExtraCharge[]> {
    const charges = await prisma.recurringExtraCharge.findMany({
      where: {
        deletedAt: null,
        expiresAt: {
          gte: new Date(),
        },
        student: {
          schoolId,
        },
      },
    });
    return charges.map(this.toDomain);
  }

  async findByStudentId(studentId: string, schoolId: string): Promise<RecurringExtraCharge[]> {
    const charges = await prisma.recurringExtraCharge.findMany({
      where: {
        studentId,
        deletedAt: null,
        student: {
          schoolId,
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });

    return charges.map(this.toDomain);
  }

  async findActiveByStudentIdAndDate(
    studentId: string,
    billingMonth: number,
    billingYear: number,
    schoolId: string
  ): Promise<RecurringExtraCharge[]> {
    const billingDate = new Date(billingYear, billingMonth - 1, 1);

    const charges = await prisma.recurringExtraCharge.findMany({
      where: {
        studentId,
        deletedAt: null,
        expiresAt: {
          gte: billingDate,
        },
        student: {
          schoolId,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return charges.map(this.toDomain);
  }

  async delete(id: string, schoolId: string): Promise<void> {
    await prisma.recurringExtraCharge.updateMany({
      where: {
        id,
        student: {
          schoolId,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private toDomain(prismaCharge: any): RecurringExtraCharge {
    return new RecurringExtraCharge(
      prismaCharge.id,
      prismaCharge.studentId,
      prismaCharge.description,
      Number(prismaCharge.amount),
      prismaCharge.expiresAt,
      prismaCharge.deletedAt,
      prismaCharge.createdAt,
      prismaCharge.updatedAt
    );
  }
}

