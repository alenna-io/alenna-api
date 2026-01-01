import { Request, Response } from 'express';
import { container } from '../../di/container';
import prisma from '../../database/prisma.client';
import { BillingRecord } from '../../../domain/entities';
import {
  CreateBillingRecordDTO,
  BulkCreateBillingRecordsDTO,
  UpdateBillingRecordDTO,
  RecordManualPaymentDTO,
  RecordPartialPaymentDTO,
  ApplyLateFeeDTO,
  BulkApplyLateFeeDTO,
  CreateTuitionConfigDTO,
  UpdateTuitionConfigDTO,
  CreateStudentScholarshipDTO,
  UpdateStudentScholarshipDTO,
  GetBillingRecordsDTO,
  GetBillingMetricsDTO,
  GetBillingDashboardDTO,
  CreateTuitionTypeDTO,
  UpdateTuitionTypeDTO,
  BulkUpdateBillingRecordsDTO,
} from '../../../app/dtos';

export class BillingController {
  async getBillingRecords(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const validatedData = GetBillingRecordsDTO.parse(req.query);
      const records = await container.getBillingRecordsUseCase.execute(validatedData, schoolId);

      // Get student names for all records
      const studentIds = [...new Set(records.map((r: BillingRecord) => r.studentId))] as string[];
      const students = await prisma.student.findMany({
        where: {
          id: { in: studentIds },
          schoolId,
        },
        include: {
          user: true,
        },
      });
      const studentMap = new Map(students.map((s: any) => [s.id, s]));

      // Get payment transactions for all records
      const recordIds = records.map((r: BillingRecord) => r.id);
      const allPaymentTransactions = recordIds.length > 0 ? await prisma.billingPaymentTransaction.findMany({
        where: {
          billingRecordId: { in: recordIds },
        },
        orderBy: {
          paidAt: 'desc',
        },
      }) : [];
      const transactionsByRecordId = new Map<string, typeof allPaymentTransactions>();
      allPaymentTransactions.forEach((tx: any) => {
        if (!transactionsByRecordId.has(tx.billingRecordId)) {
          transactionsByRecordId.set(tx.billingRecordId, []);
        }
        transactionsByRecordId.get(tx.billingRecordId)!.push(tx);
      });

      // Get user names for audit metadata and payment transactions
      const userIds = new Set<string>();
      records.forEach((r: BillingRecord) => {
        const audit = r.auditMetadata as any;
        if (audit?.paidBy) userIds.add(audit.paidBy);
        if (audit?.createdBy) userIds.add(audit.createdBy);
        if (audit?.updatedBy) userIds.add(audit.updatedBy);
        if (audit?.lateFeeAppliedBy) userIds.add(audit.lateFeeAppliedBy);
      });
      allPaymentTransactions.forEach((tx: any) => userIds.add(tx.paidBy));

      const users = userIds.size > 0 ? await prisma.user.findMany({
        where: {
          id: { in: Array.from(userIds) },
          schoolId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      }) : [];
      const userMap = new Map(users.map((u: any) => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u.id]));

      res.json(records.map((record: BillingRecord) => {
        const student = studentMap.get(record.studentId);
        const studentName = student?.user
          ? `${(student.user as any).firstName} ${(student.user as any).lastName}`
          : 'Unknown Student';

        // Enhance audit metadata with user names
        const audit = record.auditMetadata as any;
        const enhancedAudit = { ...audit };
        if (audit?.paidBy) {
          enhancedAudit.paidByName = userMap.get(audit.paidBy) || audit.paidBy;
        }
        if (audit?.createdBy) {
          enhancedAudit.createdByName = userMap.get(audit.createdBy) || audit.createdBy;
        }
        if (audit?.updatedBy) {
          enhancedAudit.updatedByName = userMap.get(audit.updatedBy) || audit.updatedBy;
        }
        if (audit?.lateFeeAppliedBy) {
          enhancedAudit.lateFeeAppliedByName = userMap.get(audit.lateFeeAppliedBy) || audit.lateFeeAppliedBy;
        }

        return {
          id: record.id,
          studentId: record.studentId,
          studentName,
          schoolYearId: record.schoolYearId,
          billingMonth: record.billingMonth,
          billingYear: record.billingYear,
          tuitionTypeSnapshot: record.tuitionTypeSnapshot,
          effectiveTuitionAmount: record.effectiveTuitionAmount,
          scholarshipAmount: record.scholarshipAmount,
          discountAdjustments: record.discountAdjustments,
          extraCharges: record.extraCharges,
          lateFeeAmount: record.lateFeeAmount,
          finalAmount: record.finalAmount,
          billStatus: record.billStatus,
          paymentStatus: record.paymentStatus,
          paidAmount: record.paidAmount,
          paidAt: record.paidAt?.toISOString() || null,
          lockedAt: record.lockedAt?.toISOString() || null,
          paymentMethod: record.paymentMethod,
          paymentNote: record.paymentNote,
          paymentGateway: record.paymentGateway,
          paymentTransactionId: record.paymentTransactionId,
          paymentGatewayStatus: record.paymentGatewayStatus,
          paymentWebhookReceivedAt: record.paymentWebhookReceivedAt?.toISOString() || null,
          auditMetadata: enhancedAudit,
          dueDate: record.dueDate.toISOString(),
          createdAt: record.createdAt?.toISOString(),
          updatedAt: record.updatedAt?.toISOString(),
          isOverdue: record.isOverdue,
          isPaid: record.isPaid,
          canEdit: record.canEdit,
          paymentTransactions: (transactionsByRecordId.get(record.id) || []).map((tx: any) => ({
            id: tx.id,
            amount: Number(tx.amount),
            paymentMethod: tx.paymentMethod,
            paymentNote: tx.paymentNote,
            paidBy: tx.paidBy,
            paidByName: userMap.get(tx.paidBy) || tx.paidBy,
            paidAt: tx.paidAt.toISOString(),
            createdAt: tx.createdAt.toISOString(),
          })),
        };
      }));
    } catch (error: any) {
      console.error('Error getting billing records:', error);
      res.status(500).json({ error: error.message || 'Failed to get billing records' });
    }
  }

  async getBillingRecordById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const record = await container.getBillingRecordByIdUseCase.execute(id, schoolId);

      if (!record) {
        res.status(404).json({ error: 'Billing record not found' });
        return;
      }

      // Get payment transactions
      const paymentTransactions = await prisma.billingPaymentTransaction.findMany({
        where: {
          billingRecordId: id,
        },
        orderBy: {
          paidAt: 'desc',
        },
      });

      // Get user names for audit metadata and payment transactions
      const userIds = new Set<string>();
      const audit = record.auditMetadata as any;
      if (audit?.paidBy) userIds.add(audit.paidBy);
      if (audit?.createdBy) userIds.add(audit.createdBy);
      if (audit?.updatedBy) userIds.add(audit.updatedBy);
      if (audit?.lateFeeAppliedBy) userIds.add(audit.lateFeeAppliedBy);
      paymentTransactions.forEach((tx: any) => userIds.add(tx.paidBy));

      const users = userIds.size > 0 ? await prisma.user.findMany({
        where: {
          id: { in: Array.from(userIds) },
          schoolId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      }) : [];
      const userMap = new Map(users.map((u: any) => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u.id]));

      // Enhance audit metadata with user names
      const enhancedAudit = { ...audit };
      if (audit?.paidBy) {
        enhancedAudit.paidByName = userMap.get(audit.paidBy) || audit.paidBy;
      }
      if (audit?.createdBy) {
        enhancedAudit.createdByName = userMap.get(audit.createdBy) || audit.createdBy;
      }
      if (audit?.updatedBy) {
        enhancedAudit.updatedByName = userMap.get(audit.updatedBy) || audit.updatedBy;
      }
      if (audit?.lateFeeAppliedBy) {
        enhancedAudit.lateFeeAppliedByName = userMap.get(audit.lateFeeAppliedBy) || audit.lateFeeAppliedBy;
      }

      res.json({
        id: record.id,
        studentId: record.studentId,
        schoolYearId: record.schoolYearId,
        billingMonth: record.billingMonth,
        billingYear: record.billingYear,
        tuitionTypeSnapshot: record.tuitionTypeSnapshot,
        effectiveTuitionAmount: record.effectiveTuitionAmount,
        scholarshipAmount: record.scholarshipAmount,
        discountAdjustments: record.discountAdjustments,
        extraCharges: record.extraCharges,
        lateFeeAmount: record.lateFeeAmount,
        finalAmount: record.finalAmount,
        billStatus: record.billStatus,
        paymentStatus: record.paymentStatus,
        paidAmount: record.paidAmount,
        paidAt: record.paidAt?.toISOString() || null,
        lockedAt: record.lockedAt?.toISOString() || null,
        paymentMethod: record.paymentMethod,
        paymentNote: record.paymentNote,
        paymentGateway: record.paymentGateway,
        paymentTransactionId: record.paymentTransactionId,
        paymentGatewayStatus: record.paymentGatewayStatus,
        paymentWebhookReceivedAt: record.paymentWebhookReceivedAt?.toISOString() || null,
        auditMetadata: enhancedAudit,
        dueDate: record.dueDate.toISOString(),
        createdAt: record.createdAt?.toISOString(),
        updatedAt: record.updatedAt?.toISOString(),
        isOverdue: record.isOverdue,
        isPaid: record.isPaid,
        canEdit: record.canEdit,
      });
    } catch (error: any) {
      console.error('Error getting billing record:', error);
      res.status(500).json({ error: error.message || 'Failed to get billing record' });
    }
  }

  async createBillingRecord(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const userId = req.userId!;
      const validatedData = CreateBillingRecordDTO.parse(req.body);
      const record = await container.createBillingRecordUseCase.execute(validatedData, schoolId, userId);

      res.status(201).json({
        id: record.id,
        studentId: record.studentId,
        schoolYearId: record.schoolYearId,
        billingMonth: record.billingMonth,
        billingYear: record.billingYear,
        effectiveTuitionAmount: record.effectiveTuitionAmount,
        scholarshipAmount: record.scholarshipAmount,
        finalAmount: record.finalAmount,
        billStatus: record.billStatus,
        paymentStatus: record.paymentStatus,
        createdAt: record.createdAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating billing record:', error);
      res.status(400).json({ error: error.message || 'Failed to create billing record' });
    }
  }

  async bulkCreateBillingRecords(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const userId = req.userId!;
      const validatedData = BulkCreateBillingRecordsDTO.parse(req.body);
      const records = await container.bulkCreateBillingRecordsUseCase.execute(validatedData, schoolId, userId);

      res.status(201).json({
        count: records.length,
        records: records.map((record: BillingRecord) => ({
          id: record.id,
          studentId: record.studentId,
          billingMonth: record.billingMonth,
          billingYear: record.billingYear,
          finalAmount: record.finalAmount,
        })),
      });
    } catch (error: any) {
      console.error('Error bulk creating billing records:', error);
      res.status(400).json({ error: error.message || 'Failed to bulk create billing records' });
    }
  }

  async bulkUpdateBillingRecords(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const userId = req.userId!;
      const validatedData = BulkUpdateBillingRecordsDTO.parse(req.body);
      const result = await container.bulkUpdateBillingRecordsUseCase.execute(
        validatedData.schoolYearId,
        validatedData.billingMonth,
        validatedData.billingYear,
        schoolId,
        userId
      );

      res.status(200).json({
        message: `Successfully updated ${result.updated} billing record(s). ${result.skipped} record(s) skipped (locked or paid).`,
        updated: result.updated,
        skipped: result.skipped,
      });
    } catch (error: any) {
      console.error('Error bulk updating billing records:', error);
      res.status(400).json({ error: error.message || 'Failed to bulk update billing records' });
    }
  }

  async updateBillingRecord(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const userId = req.userId!;
      const validatedData = UpdateBillingRecordDTO.parse(req.body);
      const record = await container.updateBillingRecordUseCase.execute(id, schoolId, validatedData, userId);

      res.json({
        id: record.id,
        effectiveTuitionAmount: record.effectiveTuitionAmount,
        scholarshipAmount: record.scholarshipAmount,
        discountAdjustments: record.discountAdjustments,
        extraCharges: record.extraCharges,
        finalAmount: record.finalAmount,
        billStatus: record.billStatus,
        paymentStatus: record.paymentStatus,
        paidAmount: record.paidAmount,
        auditMetadata: record.auditMetadata,
        updatedAt: record.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating billing record:', error);
      res.status(400).json({ error: error.message || 'Failed to update billing record' });
    }
  }

  async recordManualPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const userId = req.userId!;
      const validatedData = RecordManualPaymentDTO.parse(req.body);
      await container.recordManualPaymentUseCase.execute(id, schoolId, validatedData, userId);

      res.status(200).json({ message: 'Payment recorded successfully' });
    } catch (error: any) {
      console.error('Error recording manual payment:', error);
      res.status(400).json({ error: error.message || 'Failed to record payment' });
    }
  }

  async recordPartialPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const userId = req.userId!;
      const validatedData = RecordPartialPaymentDTO.parse(req.body);
      await container.recordPartialPaymentUseCase.execute(id, schoolId, validatedData, userId);

      res.status(200).json({ message: 'Partial payment recorded successfully' });
    } catch (error: any) {
      console.error('Error recording partial payment:', error);
      res.status(400).json({ error: error.message || 'Failed to record partial payment' });
    }
  }

  async applyLateFee(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const userId = req.userId!;
      const validatedData = ApplyLateFeeDTO.parse(req.body);
      await container.applyLateFeeUseCase.execute(id, schoolId, validatedData, userId);

      res.status(200).json({ message: 'Late fee applied successfully' });
    } catch (error: any) {
      console.error('Error applying late fee:', error);
      res.status(400).json({ error: error.message || 'Failed to apply late fee' });
    }
  }

  async bulkApplyLateFee(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const userId = req.userId!;
      const validatedData = BulkApplyLateFeeDTO.parse(req.body);
      const count = await container.bulkApplyLateFeeUseCase.execute(schoolId, validatedData, userId);

      res.status(200).json({ message: `Late fees applied to ${count} bills`, count });
    } catch (error: any) {
      console.error('Error bulk applying late fees:', error);
      res.status(400).json({ error: error.message || 'Failed to bulk apply late fees' });
    }
  }

  async getTuitionConfig(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const config = await container.getTuitionConfigUseCase.execute(schoolId);

      if (!config) {
        res.status(404).json({ error: 'Tuition configuration not found' });
        return;
      }

      res.json({
        id: config.id,
        schoolId: config.schoolId,
        dueDay: config.dueDay,
        createdAt: config.createdAt?.toISOString(),
        updatedAt: config.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error getting tuition config:', error);
      res.status(500).json({ error: error.message || 'Failed to get tuition config' });
    }
  }

  async createTuitionConfig(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const validatedData = CreateTuitionConfigDTO.parse(req.body);
      const config = await container.createTuitionConfigUseCase.execute(validatedData, schoolId);

      res.status(201).json({
        id: config.id,
        schoolId: config.schoolId,
        dueDay: config.dueDay,
        createdAt: config.createdAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating tuition config:', error);
      res.status(400).json({ error: error.message || 'Failed to create tuition config' });
    }
  }

  async updateTuitionConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = UpdateTuitionConfigDTO.parse(req.body);
      const config = await container.updateTuitionConfigUseCase.execute(id, validatedData, schoolId);

      res.json({
        id: config.id,
        dueDay: config.dueDay,
        updatedAt: config.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating tuition config:', error);
      res.status(400).json({ error: error.message || 'Failed to update tuition config' });
    }
  }

  async getTuitionTypes(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const types = await container.getTuitionTypesUseCase.execute(schoolId);

      res.json(types.map((type: any) => ({
        id: type.id,
        schoolId: type.schoolId,
        name: type.name,
        baseAmount: type.baseAmount,
        currency: type.currency,
        lateFeeType: type.lateFeeType,
        lateFeeValue: type.lateFeeValue,
        displayOrder: type.displayOrder,
        createdAt: type.createdAt?.toISOString(),
        updatedAt: type.updatedAt?.toISOString(),
      })));
    } catch (error: any) {
      console.error('Error getting tuition types:', error);
      res.status(500).json({ error: error.message || 'Failed to get tuition types' });
    }
  }

  async getTuitionTypeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      // Note: We need to add GetTuitionTypeByIdUseCase or use the repository directly
      // For now, we'll get all and filter (inefficient but works)
      const types = await container.getTuitionTypesUseCase.execute(schoolId);
      const type = types.find((t: any) => t.id === id);

      if (!type) {
        res.status(404).json({ error: 'Tuition type not found' });
        return;
      }

      res.json({
        id: type.id,
        schoolId: type.schoolId,
        name: type.name,
        baseAmount: type.baseAmount,
        currency: type.currency,
        lateFeeType: type.lateFeeType,
        lateFeeValue: type.lateFeeValue,
        displayOrder: type.displayOrder,
        createdAt: type.createdAt?.toISOString(),
        updatedAt: type.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error getting tuition type:', error);
      res.status(500).json({ error: error.message || 'Failed to get tuition type' });
    }
  }

  async createTuitionType(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const validatedData = CreateTuitionTypeDTO.parse(req.body);
      const type = await container.createTuitionTypeUseCase.execute(validatedData, schoolId);

      res.status(201).json({
        id: type.id,
        schoolId: type.schoolId,
        name: type.name,
        baseAmount: type.baseAmount,
        currency: type.currency,
        lateFeeType: type.lateFeeType,
        lateFeeValue: type.lateFeeValue,
        displayOrder: type.displayOrder,
        createdAt: type.createdAt?.toISOString(),
        updatedAt: type.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating tuition type:', error);
      res.status(400).json({ error: error.message || 'Failed to create tuition type' });
    }
  }

  async updateTuitionType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = UpdateTuitionTypeDTO.parse(req.body);
      const type = await container.updateTuitionTypeUseCase.execute(id, validatedData, schoolId);

      res.json({
        id: type.id,
        name: type.name,
        baseAmount: type.baseAmount,
        currency: type.currency,
        lateFeeType: type.lateFeeType,
        lateFeeValue: type.lateFeeValue,
        displayOrder: type.displayOrder,
        updatedAt: type.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating tuition type:', error);
      res.status(400).json({ error: error.message || 'Failed to update tuition type' });
    }
  }

  async deleteTuitionType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      await container.deleteTuitionTypeUseCase.execute(id, schoolId);

      res.status(200).json({ message: 'Tuition type deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting tuition type:', error);
      res.status(400).json({ error: error.message || 'Failed to delete tuition type' });
    }
  }

  async getStudentScholarship(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId!;
      const scholarship = await container.getStudentScholarshipUseCase.execute(studentId, schoolId);

      if (!scholarship) {
        res.status(404).json({ error: 'Student scholarship not found' });
        return;
      }

      res.json({
        id: scholarship.id,
        studentId: scholarship.studentId,
        tuitionTypeId: scholarship.tuitionTypeId,
        scholarshipType: scholarship.scholarshipType,
        scholarshipValue: scholarship.scholarshipValue,
        createdAt: scholarship.createdAt?.toISOString(),
        updatedAt: scholarship.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error getting student scholarship:', error);
      res.status(500).json({ error: error.message || 'Failed to get student scholarship' });
    }
  }

  async createStudentScholarship(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = CreateStudentScholarshipDTO.parse(req.body);
      const scholarship = await container.createStudentScholarshipUseCase.execute(validatedData, studentId, schoolId);

      res.status(201).json({
        id: scholarship.id,
        studentId: scholarship.studentId,
        tuitionTypeId: scholarship.tuitionTypeId,
        scholarshipType: scholarship.scholarshipType,
        scholarshipValue: scholarship.scholarshipValue,
        createdAt: scholarship.createdAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating student scholarship:', error);
      res.status(400).json({ error: error.message || 'Failed to create student scholarship' });
    }
  }

  async updateStudentScholarship(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = UpdateStudentScholarshipDTO.parse(req.body);
      const scholarship = await container.updateStudentScholarshipUseCase.execute(studentId, validatedData, schoolId);

      res.json({
        id: scholarship.id,
        tuitionTypeId: scholarship.tuitionTypeId,
        scholarshipType: scholarship.scholarshipType,
        scholarshipValue: scholarship.scholarshipValue,
        updatedAt: scholarship.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating student scholarship:', error);
      res.status(400).json({ error: error.message || 'Failed to update student scholarship' });
    }
  }

  async getBillingMetrics(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const validatedData = GetBillingMetricsDTO.parse(req.query);
      const metrics = await container.getBillingMetricsUseCase.execute(validatedData, schoolId);

      res.json(metrics);
    } catch (error: any) {
      console.error('Error getting billing metrics:', error);
      res.status(500).json({ error: error.message || 'Failed to get billing metrics' });
    }
  }

  async getBillingDashboard(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const validatedData = GetBillingDashboardDTO.parse(req.query);
      const data = await container.getBillingDashboardDataUseCase.execute(validatedData, schoolId);

      res.json(data);
    } catch (error: any) {
      console.error('Error getting billing dashboard:', error);
      res.status(500).json({ error: error.message || 'Failed to get billing dashboard' });
    }
  }
}
