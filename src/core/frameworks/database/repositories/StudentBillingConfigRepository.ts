import { StudentBillingConfig } from '../../../domain/entities';
import { IStudentBillingConfigRepository } from '../../../adapters_interface/repositories';
import prisma from '../prisma.client';

export class StudentBillingConfigRepository implements IStudentBillingConfigRepository {
  async findBySchoolId(schoolId: string): Promise<StudentBillingConfig[]> {
    const configs = await prisma.studentBillingConfig.findMany({
      where: {
        student: {
          schoolId,
          deletedAt: null,
        },
      },
    });
    return configs.map(this.toDomain);
  }

  async findByStudentId(studentId: string): Promise<StudentBillingConfig | null> {
    const config = await prisma.studentBillingConfig.findFirst({
      where: {
        studentId,
      },
    });
    return config ? this.toDomain(config) : null;
  }


  async findById(id: string): Promise<StudentBillingConfig | null> {
    const config = await prisma.studentBillingConfig.findFirst({
      where: {
        id
      },
    });
    return config ? this.toDomain(config) : null;
  }


  async create(studentBillingConfig: StudentBillingConfig): Promise<StudentBillingConfig> {
    const created = await prisma.studentBillingConfig.create({
      data: {
        studentId: studentBillingConfig.studentId,
        requiresTaxableInvoice: studentBillingConfig.requiresTaxableInvoice,
      },
    });
    return this.toDomain(created);
  }


  async update(id: string, studentBillingConfig: Partial<StudentBillingConfig>): Promise<StudentBillingConfig> {
    const existing = await prisma.studentBillingConfig.findFirst({
      where: { id },
    });
    if (!existing) {
      throw new Error('Student billing config not found');
    }
    const updated = await prisma.studentBillingConfig.update({
      where: { id },
      data: {
        requiresTaxableInvoice: studentBillingConfig.requiresTaxableInvoice,
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.studentBillingConfig.delete({
      where: { id },
    });
  }

  private toDomain(prismaConfig: any): StudentBillingConfig {
    return new StudentBillingConfig(
      prismaConfig.id,
      prismaConfig.studentId,
      prismaConfig.requiresTaxableInvoice,
      prismaConfig.createdAt,
      prismaConfig.updatedAt
    );
  }
}
