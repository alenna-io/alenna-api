import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { BillingRecord } from '../../../domain/entities';
import prisma from '../prisma.client';
import { BillingRecordMapper } from '../mappers';

export class BillingRecordRepository implements IBillingRecordRepository {
  async findById(id: string, schoolId: string): Promise<BillingRecord | null> {
    const record = await prisma.billingRecord.findFirst({
      where: {
        id,
        student: {
          schoolId,
          deletedAt: null,
        },
      },
    });

    return record ? BillingRecordMapper.toDomain(record) : null;
  }

  async findByStudentId(studentId: string, schoolId: string): Promise<BillingRecord[]> {
    const records = await prisma.billingRecord.findMany({
      where: {
        studentId,
        student: {
          schoolId,
          deletedAt: null,
        },
      },
      orderBy: [
        { billingYear: 'desc' },
        { billingMonth: 'desc' },
      ],
    });

    return records.map(BillingRecordMapper.toDomain);
  }

  async findByMonthAndYear(studentId: string, billingMonth: number, billingYear: number, schoolId: string): Promise<BillingRecord | null> {
    const record = await prisma.billingRecord.findFirst({
      where: {
        studentId,
        billingMonth,
        billingYear,
        student: {
          schoolId,
          deletedAt: null,
        },
      },
    });

    return record ? BillingRecordMapper.toDomain(record) : null;
  }

  async findBySchoolYear(schoolYearId: string, schoolId: string): Promise<BillingRecord[]> {
    const records = await prisma.billingRecord.findMany({
      where: {
        schoolYearId,
        student: {
          schoolId,
          deletedAt: null,
        },
      },
      orderBy: [
        { billingYear: 'desc' },
        { billingMonth: 'desc' },
      ],
    });

    return records.map(BillingRecordMapper.toDomain);
  }

  async findUnpaidBills(schoolId: string, startDate?: Date, endDate?: Date): Promise<BillingRecord[]> {
    const where: any = {
      student: {
        schoolId,
        deletedAt: null,
      },
      paymentStatus: 'unpaid',
    };

    if (startDate || endDate) {
      where.OR = [];
      if (startDate) {
        where.OR.push({
          billingYear: startDate.getFullYear(),
          billingMonth: { gte: startDate.getMonth() + 1 },
        });
      }
      if (endDate) {
        where.OR.push({
          billingYear: endDate.getFullYear(),
          billingMonth: { lte: endDate.getMonth() + 1 },
        });
      }
    }

    const records = await prisma.billingRecord.findMany({
      where,
      orderBy: [
        { billingYear: 'desc' },
        { billingMonth: 'desc' },
      ],
    });

    return records.map(BillingRecordMapper.toDomain);
  }

  async findBillsRequiringLateFee(schoolId: string, dueDate: Date): Promise<BillingRecord[]> {
    const records = await prisma.billingRecord.findMany({
      where: {
        student: {
          schoolId,
          deletedAt: null,
        },
        paymentStatus: 'unpaid',
        lateFeeAmount: 0,
        OR: [
          {
            billingYear: dueDate.getFullYear(),
            billingMonth: { lt: dueDate.getMonth() + 1 },
          },
          {
            billingYear: { lt: dueDate.getFullYear() },
          },
        ],
      },
    });

    return records.map(BillingRecordMapper.toDomain);
  }

  async findByFilters(filters: {
    schoolId: string;
    studentId?: string;
    schoolYearId?: string;
    billingMonth?: number;
    billingYear?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<BillingRecord[]> {
    const where: any = {
      student: {
        schoolId: filters.schoolId,
        deletedAt: null,
      },
    };

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.schoolYearId) {
      where.schoolYearId = filters.schoolYearId;
    }

    if (filters.billingMonth) {
      where.billingMonth = filters.billingMonth;
    }

    if (filters.billingYear) {
      where.billingYear = filters.billingYear;
    }

    if (filters.status) {
      // Support both old 'status' filter (for backward compatibility) and new status fields
      // If status is 'paid', check paymentStatus; otherwise check billStatus
      if (filters.status === 'paid') {
        where.paymentStatus = 'paid';
      } else {
        where.billStatus = filters.status;
      }
    }

    if (filters.startDate || filters.endDate) {
      where.OR = [];
      if (filters.startDate) {
        where.OR.push({
          billingYear: filters.startDate.getFullYear(),
          billingMonth: { gte: filters.startDate.getMonth() + 1 },
        });
      }
      if (filters.endDate) {
        where.OR.push({
          billingYear: filters.endDate.getFullYear(),
          billingMonth: { lte: filters.endDate.getMonth() + 1 },
        });
      }
    }

    const records = await prisma.billingRecord.findMany({
      where,
      orderBy: [
        { billingYear: 'desc' },
        { billingMonth: 'desc' },
      ],
    });

    return records.map(BillingRecordMapper.toDomain);
  }

  async create(billingRecord: BillingRecord): Promise<BillingRecord> {
    const created = await prisma.billingRecord.create({
      data: BillingRecordMapper.toPrisma(billingRecord),
    });

    return BillingRecordMapper.toDomain(created);
  }

  async createMany(billingRecords: BillingRecord[]): Promise<BillingRecord[]> {
    await prisma.billingRecord.createMany({
      data: billingRecords.map(BillingRecordMapper.toPrisma),
    });

    const records = await prisma.billingRecord.findMany({
      where: {
        id: {
          in: billingRecords.map(r => r.id),
        },
      },
    });

    return records.map(BillingRecordMapper.toDomain);
  }

  async update(id: string, billingRecord: Partial<BillingRecord>, schoolId: string): Promise<BillingRecord> {
    const existing = await this.findById(id, schoolId);
    if (!existing) {
      throw new Error('Billing record not found');
    }

    // If a full entity is passed (common pattern), use the mapper directly
    if ((billingRecord as BillingRecord).id === id) {
      const prismaData = BillingRecordMapper.toPrisma(billingRecord as BillingRecord);
      const { id: _, ...updateData } = prismaData;
      const updated = await prisma.billingRecord.update({
        where: { id },
        data: updateData,
      });
      return BillingRecordMapper.toDomain(updated);
    }

    // Fallback to field-level updates (for Partial<BillingRecord>)
    const updateData: any = {};
    const entity = billingRecord as any;
    if (entity.effectiveTuitionAmount !== undefined) updateData.effectiveTuitionAmount = entity.effectiveTuitionAmount;
    if (entity.scholarshipAmount !== undefined) updateData.scholarshipAmount = entity.scholarshipAmount;
    if (entity.finalAmount !== undefined) updateData.finalAmount = entity.finalAmount;
    if (entity.lateFeeAmount !== undefined) updateData.lateFeeAmount = entity.lateFeeAmount;
    if (entity.discountAdjustments !== undefined) updateData.discountAdjustments = entity.discountAdjustments;
    if (entity.extraCharges !== undefined) updateData.extraCharges = entity.extraCharges;
    if (entity.billStatus !== undefined) updateData.billStatus = entity.billStatus;
    if (entity.paymentStatus !== undefined) updateData.paymentStatus = entity.paymentStatus;
    if (entity.paidAt !== undefined) updateData.paidAt = entity.paidAt;
    if (entity.lockedAt !== undefined) updateData.lockedAt = entity.lockedAt;
    if (entity.auditMetadata !== undefined) updateData.auditMetadata = entity.auditMetadata;
    if (entity.paymentMethod !== undefined) updateData.paymentMethod = entity.paymentMethod;
    if (entity.paymentNote !== undefined) updateData.paymentNote = entity.paymentNote;
    if (entity.paymentGateway !== undefined) updateData.paymentGateway = entity.paymentGateway;
    if (entity.paymentTransactionId !== undefined) updateData.paymentTransactionId = entity.paymentTransactionId;
    if (entity.paymentGatewayStatus !== undefined) updateData.paymentGatewayStatus = entity.paymentGatewayStatus;
    if (entity.paymentWebhookReceivedAt !== undefined) updateData.paymentWebhookReceivedAt = entity.paymentWebhookReceivedAt;
    if (entity.dueDate !== undefined) updateData.dueDate = entity.dueDate;

    const updated = await prisma.billingRecord.update({
      where: { id },
      data: updateData,
    });

    return BillingRecordMapper.toDomain(updated);
  }

  async delete(id: string, schoolId: string): Promise<void> {
    const existing = await this.findById(id, schoolId);
    if (!existing) {
      throw new Error('Billing record not found');
    }

    await prisma.billingRecord.delete({
      where: { id },
    });
  }

  async getMetrics(filters: {
    schoolId: string;
    startDate?: Date;
    endDate?: Date;
    schoolYearId?: string;
  }): Promise<{
    totalIncome: number;
    expectedIncome: number;
    missingIncome: number;
    totalStudentsPaid: number;
    totalStudentsNotPaid: number;
    lateFeesApplied: number;
  }> {
    const where: any = {
      student: {
        schoolId: filters.schoolId,
        deletedAt: null,
      },
    };

    if (filters.schoolYearId) {
      where.schoolYearId = filters.schoolYearId;
    }

    if (filters.startDate || filters.endDate) {
      where.OR = [];
      if (filters.startDate) {
        where.OR.push({
          billingYear: filters.startDate.getFullYear(),
          billingMonth: { gte: filters.startDate.getMonth() + 1 },
        });
      }
      if (filters.endDate) {
        where.OR.push({
          billingYear: filters.endDate.getFullYear(),
          billingMonth: { lte: filters.endDate.getMonth() + 1 },
        });
      }
    }

    const [paidRecords, expectedRecords, unpaidStudents, lateFeeRecords] = await Promise.all([
      prisma.billingRecord.aggregate({
        where: {
          ...where,
          paymentStatus: 'paid',
        },
        _sum: {
          finalAmount: true,
        },
      }),
      prisma.billingRecord.aggregate({
        where: {
          ...where,
          billStatus: {
            in: ['required', 'sent', 'not_required'],
          },
        },
        _sum: {
          finalAmount: true,
        },
      }),
      prisma.billingRecord.findMany({
        where: {
          ...where,
          paymentStatus: 'unpaid',
        },
        select: {
          studentId: true,
        },
        distinct: ['studentId'],
      }),
      prisma.billingRecord.aggregate({
        where: {
          ...where,
          lateFeeAmount: {
            gt: 0,
          },
        },
        _sum: {
          lateFeeAmount: true,
        },
      }),
    ]);

    const paidStudents = await prisma.billingRecord.findMany({
      where: {
        ...where,
        paymentStatus: 'paid',
      },
      select: {
        studentId: true,
      },
      distinct: ['studentId'],
    });

    const totalIncome = Number(paidRecords._sum.finalAmount || 0);
    const expectedIncome = Number(expectedRecords._sum.finalAmount || 0);
    const missingIncome = expectedIncome - totalIncome;
    const totalStudentsPaid = paidStudents.length;
    const totalStudentsNotPaid = unpaidStudents.length;
    const lateFeesApplied = Number(lateFeeRecords._sum.lateFeeAmount || 0);

    return {
      totalIncome,
      expectedIncome,
      missingIncome,
      totalStudentsPaid,
      totalStudentsNotPaid,
      lateFeesApplied,
    };
  }

  async getDashboardData(filters: {
    schoolId: string;
    startDate: Date;
    endDate: Date;
    schoolYearId?: string;
  }): Promise<Array<{
    month: number;
    year: number;
    expectedIncome: number;
    actualIncome: number;
    missingIncome: number;
    paidCount: number;
    unpaidCount: number;
    lateFeesApplied: number;
  }>> {
    const where: any = {
      student: {
        schoolId: filters.schoolId,
        deletedAt: null,
      },
    };

    if (filters.schoolYearId) {
      where.schoolYearId = filters.schoolYearId;
    }

    const startYear = filters.startDate.getFullYear();
    const startMonth = filters.startDate.getMonth() + 1;
    const endYear = filters.endDate.getFullYear();
    const endMonth = filters.endDate.getMonth() + 1;

    where.OR = [];
    if (startYear === endYear) {
      where.OR.push({
        billingYear: startYear,
        billingMonth: { gte: startMonth, lte: endMonth },
      });
    } else {
      where.OR.push({
        billingYear: startYear,
        billingMonth: { gte: startMonth },
      });
      if (endYear > startYear + 1) {
        where.OR.push({
          billingYear: { gt: startYear, lt: endYear },
        });
      }
      where.OR.push({
        billingYear: endYear,
        billingMonth: { lte: endMonth },
      });
    }

    const records = await prisma.billingRecord.findMany({
      where,
    });

    const monthlyData = new Map<string, {
      month: number;
      year: number;
      expectedIncome: number;
      actualIncome: number;
      paidCount: number;
      unpaidCount: number;
      lateFeesApplied: number;
    }>();

    for (const record of records) {
      const key = `${record.billingYear}-${record.billingMonth}`;
      if (!monthlyData.has(key)) {
        monthlyData.set(key, {
          month: record.billingMonth,
          year: record.billingYear,
          expectedIncome: 0,
          actualIncome: 0,
          paidCount: 0,
          unpaidCount: 0,
          lateFeesApplied: 0,
        });
      }

      const data = monthlyData.get(key)!;
      const amount = Number(record.finalAmount);

      if (['required', 'sent', 'not_required'].includes(record.billStatus)) {
        data.expectedIncome += amount;
      }

      if (record.paymentStatus === 'paid') {
        data.actualIncome += amount;
        data.paidCount++;
      } else if (record.paymentStatus === 'unpaid') {
        data.unpaidCount++;
      }

      const lateFeeAmount = Number(record.lateFeeAmount || 0);
      if (lateFeeAmount > 0) {
        data.lateFeesApplied += lateFeeAmount;
      }
    }

    const result = Array.from(monthlyData.values()).map(data => ({
      ...data,
      missingIncome: data.expectedIncome - data.actualIncome,
    }));

    return result.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }
}

