import { BillingRecord as PrismaBillingRecord, Prisma } from '@prisma/client';
import { BillingRecord, BillStatus, PaymentStatus, PaymentMethod, TuitionTypeSnapshot, DiscountAdjustment, ExtraCharge, AuditMetadata } from '../../../domain/entities';
import { Decimal } from '@prisma/client/runtime/library';

export class BillingRecordMapper {
  static toDomain(prismaRecord: PrismaBillingRecord): BillingRecord {
    const tuitionTypeSnapshot = prismaRecord.tuitionTypeSnapshot as unknown as TuitionTypeSnapshot;
    const discountAdjustments = prismaRecord.discountAdjustments as unknown as DiscountAdjustment[];
    const extraCharges = prismaRecord.extraCharges as unknown as ExtraCharge[];
    const auditMetadata = prismaRecord.auditMetadata as unknown as AuditMetadata;

    return new BillingRecord(
      prismaRecord.id,
      prismaRecord.studentId,
      prismaRecord.schoolYearId,
      prismaRecord.billingMonth,
      prismaRecord.billingYear,
      tuitionTypeSnapshot,
      Number(prismaRecord.effectiveTuitionAmount),
      Number(prismaRecord.scholarshipAmount),
      discountAdjustments,
      extraCharges,
      Number(prismaRecord.lateFeeAmount),
      Number(prismaRecord.finalAmount),
      prismaRecord.billStatus as BillStatus,
      prismaRecord.paymentStatus as PaymentStatus,
      prismaRecord.paidAt,
      prismaRecord.lockedAt,
      auditMetadata,
      prismaRecord.paymentNote,
      prismaRecord.paymentMethod as PaymentMethod | null,
      prismaRecord.paymentGateway,
      prismaRecord.paymentTransactionId,
      prismaRecord.paymentGatewayStatus,
      prismaRecord.paymentWebhookReceivedAt,
      prismaRecord.dueDate,
      prismaRecord.createdAt,
      prismaRecord.updatedAt
    );
  }

  static toPrisma(billingRecord: BillingRecord): Omit<PrismaBillingRecord, 'createdAt' | 'updatedAt' | 'tuitionTypeSnapshot' | 'discountAdjustments' | 'extraCharges' | 'auditMetadata'> & {
    tuitionTypeSnapshot: Prisma.InputJsonValue;
    discountAdjustments: Prisma.InputJsonValue;
    extraCharges: Prisma.InputJsonValue;
    auditMetadata: Prisma.InputJsonValue;
  } {
    return {
      id: billingRecord.id,
      studentId: billingRecord.studentId,
      schoolYearId: billingRecord.schoolYearId,
      billingMonth: billingRecord.billingMonth,
      billingYear: billingRecord.billingYear,
      tuitionTypeSnapshot: billingRecord.tuitionTypeSnapshot as unknown as Prisma.InputJsonValue,
      effectiveTuitionAmount: new Decimal(billingRecord.effectiveTuitionAmount),
      scholarshipAmount: new Decimal(billingRecord.scholarshipAmount),
      discountAdjustments: billingRecord.discountAdjustments as unknown as Prisma.InputJsonValue,
      extraCharges: billingRecord.extraCharges as unknown as Prisma.InputJsonValue,
      lateFeeAmount: new Decimal(billingRecord.lateFeeAmount),
      finalAmount: new Decimal(billingRecord.finalAmount),
      billStatus: billingRecord.billStatus,
      paymentStatus: billingRecord.paymentStatus,
      paidAt: billingRecord.paidAt,
      lockedAt: billingRecord.lockedAt,
      auditMetadata: billingRecord.auditMetadata as unknown as Prisma.InputJsonValue,
      paymentNote: billingRecord.paymentNote,
      paymentMethod: billingRecord.paymentMethod,
      paymentGateway: billingRecord.paymentGateway,
      paymentTransactionId: billingRecord.paymentTransactionId,
      paymentGatewayStatus: billingRecord.paymentGatewayStatus,
      paymentWebhookReceivedAt: billingRecord.paymentWebhookReceivedAt,
      dueDate: billingRecord.dueDate,
    };
  }
}
