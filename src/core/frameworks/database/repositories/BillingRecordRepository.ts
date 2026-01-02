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
      paymentStatus: {
        in: ['pending', 'delayed', 'partial_payment'],
      },
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
        paymentStatus: {
          in: ['pending', 'delayed', 'partial_payment'],
        },
        lateFeeAmount: 0,
        billStatus: {
          not: 'not_required',
        },
        dueDate: {
          lt: dueDate,
        },
        paidAt: null,
        lockedAt: null,
      },
    });

    return records.map(BillingRecordMapper.toDomain);
  }

  async findByFilters(filters: {
    schoolId: string;
    studentId?: string;
    studentIds?: string[];
    studentName?: string;
    schoolYearId?: string;
    billingMonth?: number;
    billingYear?: number;
    status?: string;
    paymentStatus?: string;
    billStatus?: string;
    taxableBillStatus?: string;
    startDate?: Date;
    endDate?: Date;
    offset?: number;
    limit?: number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<{ records: BillingRecord[]; total: number }> {
    const where: any = {
      student: {
        schoolId: filters.schoolId,
        deletedAt: null,
      },
    };

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    // Use studentIds array if provided (for accent-insensitive search)
    if (filters.studentIds && filters.studentIds.length > 0) {
      where.studentId = { in: filters.studentIds };
    }

    // Fallback to studentName search (kept for backward compatibility)
    if (filters.studentName && !filters.studentIds) {
      where.student = {
        ...where.student,
        OR: [
          { firstName: { contains: filters.studentName, mode: 'insensitive' } },
          { lastName: { contains: filters.studentName, mode: 'insensitive' } },
        ],
      };
    }

    if (filters.schoolYearId) {
      where.schoolYearId = filters.schoolYearId;
    }

    // Filter logic: If billingMonth + billingYear provided, use them and ignore dates
    // Otherwise, use date range if provided
    if (filters.billingMonth && filters.billingYear) {
      where.billingMonth = filters.billingMonth;
      where.billingYear = filters.billingYear;
    } else if (filters.startDate || filters.endDate) {
      // Date range filtering
      if (filters.startDate && filters.endDate) {
        // Both dates provided - filter within range
        const startYear = filters.startDate.getFullYear();
        const startMonth = filters.startDate.getMonth() + 1;
        const endYear = filters.endDate.getFullYear();
        const endMonth = filters.endDate.getMonth() + 1;

        if (startYear === endYear) {
          where.billingYear = startYear;
          where.billingMonth = { gte: startMonth, lte: endMonth };
        } else {
          where.OR = [
            {
              billingYear: startYear,
              billingMonth: { gte: startMonth },
            },
            {
              billingYear: { gt: startYear, lt: endYear },
            },
            {
              billingYear: endYear,
              billingMonth: { lte: endMonth },
            },
          ];
        }
      } else if (filters.startDate) {
        // Only startDate provided - filter from that date onwards
        const startYear = filters.startDate.getFullYear();
        const startMonth = filters.startDate.getMonth() + 1;
        where.OR = [
          {
            billingYear: { gt: startYear },
          },
          {
            billingYear: startYear,
            billingMonth: { gte: startMonth },
          },
        ];
      } else if (filters.endDate) {
        // Only endDate provided - filter up to that date
        const endYear = filters.endDate.getFullYear();
        const endMonth = filters.endDate.getMonth() + 1;
        where.OR = [
          {
            billingYear: { lt: endYear },
          },
          {
            billingYear: endYear,
            billingMonth: { lte: endMonth },
          },
        ];
      }
    }

    // Handle paymentStatus filter
    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    // Handle taxableBillStatus (preferred) or billStatus (backward compatibility)
    if (filters.taxableBillStatus) {
      where.billStatus = filters.taxableBillStatus;
    } else if (filters.billStatus) {
      // Map old status values to new ones
      if (filters.billStatus === 'cancelled') {
        where.billStatus = 'not_required';
      } else {
        where.billStatus = filters.billStatus;
      }
    }

    // Support old 'status' filter for backward compatibility
    if (filters.status && !filters.paymentStatus && !filters.billStatus && !filters.taxableBillStatus) {
      // If status is 'paid' or 'unpaid', check paymentStatus; otherwise check billStatus
      if (filters.status === 'paid') {
        where.paymentStatus = 'paid';
      } else if (filters.status === 'unpaid') {
        where.paymentStatus = {
          in: ['pending', 'delayed', 'partial_payment'],
        };
      } else {
        where.billStatus = filters.status === 'cancelled' ? 'not_required' : filters.status;
      }
    }

    // Get total count for pagination
    const total = await prisma.billingRecord.count({ where });

    // Build orderBy clause
    const orderBy: any[] = [];
    if (filters.sortField) {
      const direction = filters.sortDirection === 'desc' ? 'desc' : 'asc';
      switch (filters.sortField) {
        case 'studentName':
          orderBy.push({ student: { user: { firstName: direction } } });
          orderBy.push({ student: { user: { lastName: direction } } });
          break;
        case 'month':
          orderBy.push({ billingYear: direction });
          orderBy.push({ billingMonth: direction });
          break;
        case 'tuition':
          orderBy.push({ effectiveTuitionAmount: direction });
          break;
        case 'lateFee':
          orderBy.push({ lateFeeAmount: direction });
          break;
        case 'total':
          orderBy.push({ finalAmount: direction });
          break;
        case 'paymentStatus':
          orderBy.push({ paymentStatus: direction });
          break;
        case 'dueDate':
          orderBy.push({ dueDate: direction });
          break;
        case 'paidDate':
          orderBy.push({ paidAt: direction });
          break;
        case 'billStatus':
          orderBy.push({ billStatus: direction });
          break;
        default:
          orderBy.push({ billingYear: 'desc' });
          orderBy.push({ billingMonth: 'desc' });
      }
    } else {
      // Default sorting
      orderBy.push({ billingYear: 'desc' });
      orderBy.push({ billingMonth: 'desc' });
    }

    // Special handling for tuition sorting (includes discounts and extras)
    if (filters.sortField === 'tuition') {
      // Fetch all matching records for sorting
      const allRecords = await prisma.billingRecord.findMany({
        where,
      });

      // Calculate tuition with adjustments and sort
      const recordsWithCalc = allRecords.map(record => {
        const discountAdjustments = (record.discountAdjustments as any) || [];
        const extraCharges = (record.extraCharges as any) || [];
        
        const discountAmount = discountAdjustments.reduce((sum: number, adj: any) => {
          if (adj.type === 'percentage') {
            return sum + (Number(record.effectiveTuitionAmount) - Number(record.scholarshipAmount)) * (adj.value / 100);
          }
          return sum + Number(adj.value);
        }, 0);
        
        const extraAmount = extraCharges.reduce((sum: number, charge: any) => sum + Number(charge.amount), 0);
        const tuitionWithAdjustments = Number(record.effectiveTuitionAmount) - Number(record.scholarshipAmount) - discountAmount + extraAmount;
        
        return { record, tuitionWithAdjustments };
      });

      // Sort by calculated value
      recordsWithCalc.sort((a, b) => {
        if (filters.sortDirection === 'desc') {
          return b.tuitionWithAdjustments - a.tuitionWithAdjustments;
        }
        return a.tuitionWithAdjustments - b.tuitionWithAdjustments;
      });

      // Apply pagination
      const paginatedRecords = recordsWithCalc
        .slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10))
        .map(item => item.record);

      return {
        records: paginatedRecords.map(BillingRecordMapper.toDomain),
        total,
      };
    }

    // Normal sorting for other fields
    const records = await prisma.billingRecord.findMany({
      where,
      orderBy,
      skip: filters.offset || 0,
      take: filters.limit || 10,
    });

    return {
      records: records.map(BillingRecordMapper.toDomain),
      total,
    };
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
    billingMonth?: number;
    billingYear?: number;
    paymentStatus?: string;
    studentId?: string;
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

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.schoolYearId) {
      where.schoolYearId = filters.schoolYearId;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    // Filter logic: If billingMonth + billingYear provided, use them and ignore dates
    // Otherwise, use date range if provided
    if (filters.billingMonth && filters.billingYear) {
      where.billingMonth = filters.billingMonth;
      where.billingYear = filters.billingYear;
    } else if (filters.startDate || filters.endDate) {
      // Date range filtering
      if (filters.startDate && filters.endDate) {
        // Both dates provided - filter within range
        const startYear = filters.startDate.getFullYear();
        const startMonth = filters.startDate.getMonth() + 1;
        const endYear = filters.endDate.getFullYear();
        const endMonth = filters.endDate.getMonth() + 1;

        if (startYear === endYear) {
          where.billingYear = startYear;
          where.billingMonth = { gte: startMonth, lte: endMonth };
        } else {
          where.OR = [
            {
              billingYear: startYear,
              billingMonth: { gte: startMonth },
            },
            {
              billingYear: { gt: startYear, lt: endYear },
            },
            {
              billingYear: endYear,
              billingMonth: { lte: endMonth },
            },
          ];
        }
      } else if (filters.startDate) {
        // Only startDate provided - filter from that date onwards
        const startYear = filters.startDate.getFullYear();
        const startMonth = filters.startDate.getMonth() + 1;
        where.OR = [
          {
            billingYear: { gt: startYear },
          },
          {
            billingYear: startYear,
            billingMonth: { gte: startMonth },
          },
        ];
      } else if (filters.endDate) {
        // Only endDate provided - filter up to that date
        const endYear = filters.endDate.getFullYear();
        const endMonth = filters.endDate.getMonth() + 1;
        where.OR = [
          {
            billingYear: { lt: endYear },
          },
          {
            billingYear: endYear,
            billingMonth: { lte: endMonth },
          },
        ];
      }
    }

    // Get all billing records to calculate metrics accurately
    const allRecords = await prisma.billingRecord.findMany({
      where,
      select: {
        finalAmount: true,
        paidAmount: true,
        paymentStatus: true,
        billStatus: true,
        lateFeeAmount: true,
        studentId: true,
      },
    });

    // Calculate total income: sum of paidAmount for all records (includes partial payments)
    const totalIncome = allRecords.reduce((sum, record) => {
      return sum + Number(record.paidAmount || 0);
    }, 0);

    // Calculate expected income: sum of finalAmount for all records
    const expectedIncome = allRecords.reduce((sum, record) => {
      return sum + Number(record.finalAmount || 0);
    }, 0);

    // Calculate late fees: sum of all lateFeeAmount
    const lateFeesApplied = allRecords.reduce((sum, record) => {
      return sum + Number(record.lateFeeAmount || 0);
    }, 0);

    // Count paid students (fully paid only)
    const paidStudentIds = new Set(
      allRecords
        .filter(record => record.paymentStatus === 'paid')
        .map(record => record.studentId)
    );
    const totalStudentsPaid = paidStudentIds.size;

    // Count unpaid students (pending, delayed, or partial payment)
    const unpaidStudentIds = new Set(
      allRecords
        .filter(record => ['pending', 'delayed', 'partial_payment'].includes(record.paymentStatus))
        .map(record => record.studentId)
    );
    const totalStudentsNotPaid = unpaidStudentIds.size;

    const missingIncome = expectedIncome - totalIncome;

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
      } else if (['pending', 'delayed', 'partial_payment'].includes(record.paymentStatus)) {
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

  async createPaymentTransaction(data: {
    billingRecordId: string;
    amount: number;
    paymentMethod: string;
    paymentNote?: string | null;
    paidBy: string;
    paidAt?: Date;
  }): Promise<void> {
    await prisma.billingPaymentTransaction.create({
      data: {
        billingRecordId: data.billingRecordId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentNote: data.paymentNote || null,
        paidBy: data.paidBy,
        paidAt: data.paidAt || new Date(),
      },
    });
  }

  async findPaymentTransactions(billingRecordId: string): Promise<Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    paymentNote: string | null;
    paidBy: string;
    paidAt: Date;
    createdAt: Date;
  }>> {
    const transactions = await prisma.billingPaymentTransaction.findMany({
      where: {
        billingRecordId,
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    return transactions.map(tx => ({
      id: tx.id,
      amount: Number(tx.amount),
      paymentMethod: tx.paymentMethod,
      paymentNote: tx.paymentNote,
      paidBy: tx.paidBy,
      paidAt: tx.paidAt,
      createdAt: tx.createdAt,
    }));
  }

  async findPaymentTransactionsByRecordIds(billingRecordIds: string[]): Promise<Array<{
    id: string;
    billingRecordId: string;
    amount: number;
    paymentMethod: string;
    paymentNote: string | null;
    paidBy: string;
    paidAt: Date;
    createdAt: Date;
  }>> {
    if (billingRecordIds.length === 0) {
      return [];
    }

    const transactions = await prisma.billingPaymentTransaction.findMany({
      where: {
        billingRecordId: { in: billingRecordIds },
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    return transactions.map(tx => ({
      id: tx.id,
      billingRecordId: tx.billingRecordId,
      amount: Number(tx.amount),
      paymentMethod: tx.paymentMethod,
      paymentNote: tx.paymentNote,
      paidBy: tx.paidBy,
      paidAt: tx.paidAt,
      createdAt: tx.createdAt,
    }));
  }

  async updateWithPaymentTransaction(
    id: string,
    billingRecord: BillingRecord,
    paymentTransaction: {
      amount: number;
      paymentMethod: string;
      paymentNote?: string | null;
      paidBy: string;
      paidAt?: Date;
    },
    _schoolId: string
  ): Promise<BillingRecord> {
    return await prisma.$transaction(async (tx) => {
      // Update the billing record
      const prismaData = BillingRecordMapper.toPrisma(billingRecord);
      const { id: _, ...updateData } = prismaData;
      await tx.billingRecord.update({
        where: { id },
        data: updateData,
      });

      // Create payment transaction
      await tx.billingPaymentTransaction.create({
        data: {
          billingRecordId: id,
          amount: paymentTransaction.amount,
          paymentMethod: paymentTransaction.paymentMethod,
          paymentNote: paymentTransaction.paymentNote || null,
          paidBy: paymentTransaction.paidBy,
          paidAt: paymentTransaction.paidAt || new Date(),
        },
      });

      const updated = await tx.billingRecord.findUnique({ where: { id } });
      if (!updated) {
        throw new Error('Billing record not found after update');
      }
      return BillingRecordMapper.toDomain(updated);
    });
  }
}

