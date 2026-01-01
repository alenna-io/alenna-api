export type TaxableBillStatus = 'not_required' | 'required' | 'sent';
export type PaymentStatus = 'pending' | 'delayed' | 'partial_payment' | 'paid';
export type PaymentMethod = 'manual' | 'online' | 'other';

// Keep BillStatus as alias for backward compatibility during migration
export type BillStatus = TaxableBillStatus;

export interface TuitionTypeSnapshot {
  tuitionTypeId: string;
  tuitionTypeName: string;
  baseAmount: number;
  lateFeeType: 'fixed' | 'percentage';
  lateFeeValue: number;
}

export interface DiscountAdjustment {
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
}

export interface ExtraCharge {
  amount: number;
  description?: string;
}

export interface AuditMetadata {
  createdBy: string;
  updatedBy?: string;
  statusChangedBy?: string;
  paidBy?: string;
  lateFeeAppliedBy?: string;
}

export class BillingRecord {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly schoolYearId: string,
    public readonly billingMonth: number,
    public readonly billingYear: number,
    public readonly tuitionTypeSnapshot: TuitionTypeSnapshot,
    public readonly effectiveTuitionAmount: number,
    public readonly scholarshipAmount: number,
    public readonly discountAdjustments: DiscountAdjustment[],
    public readonly extraCharges: ExtraCharge[],
    public readonly lateFeeAmount: number,
    public readonly finalAmount: number,
    public readonly billStatus: BillStatus,
    public readonly paymentStatus: PaymentStatus,
    public readonly paidAmount: number,
    public readonly paidAt: Date | null,
    public readonly lockedAt: Date | null,
    public readonly auditMetadata: AuditMetadata,
    public readonly paymentNote: string | null,
    public readonly paymentMethod: PaymentMethod | null,
    public readonly paymentGateway: string | null,
    public readonly paymentTransactionId: string | null,
    public readonly paymentGatewayStatus: string | null,
    public readonly paymentWebhookReceivedAt: Date | null,
    public readonly dueDate: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {
    if (billingMonth < 1 || billingMonth > 12) {
      throw new Error('Billing month must be between 1 and 12');
    }
    if (billingYear < 2020 || billingYear > 2100) {
      throw new Error('Billing year must be between 2020 and 2100');
    }
    if (effectiveTuitionAmount < 0) {
      throw new Error('Effective tuition amount cannot be negative');
    }
    if (scholarshipAmount < 0) {
      throw new Error('Scholarship amount cannot be negative');
    }
    if (lateFeeAmount < 0) {
      throw new Error('Late fee amount cannot be negative');
    }
    for (const adjustment of discountAdjustments) {
      if (adjustment.value < 0) {
        throw new Error('Discount adjustment value cannot be negative');
      }
      if (adjustment.type === 'percentage' && adjustment.value > 100) {
        throw new Error('Discount percentage cannot exceed 100');
      }
    }
    for (const charge of extraCharges) {
      if (charge.amount < 0) {
        throw new Error('Extra charge amount cannot be negative');
      }
    }
  }

  static create(props: {
    id: string;
    studentId: string;
    schoolYearId: string;
    billingMonth: number;
    billingYear: number;
    tuitionTypeSnapshot: TuitionTypeSnapshot;
    effectiveTuitionAmount: number;
    scholarshipAmount?: number;
    discountAdjustments?: DiscountAdjustment[];
    extraCharges?: ExtraCharge[];
    lateFeeAmount?: number;
    billStatus?: BillStatus;
    dueDay: number;
    createdBy: string;
  }): BillingRecord {
    const scholarshipAmount = props.scholarshipAmount ?? 0;
    const discountAdjustments = props.discountAdjustments ?? [];
    const extraCharges = props.extraCharges ?? [];
    const lateFeeAmount = props.lateFeeAmount ?? 0;

    const discountAmount = BillingRecord.calculateDiscountAmount(discountAdjustments, props.effectiveTuitionAmount - scholarshipAmount);
    const extraAmount = BillingRecord.calculateExtraAmount(extraCharges);
    const amountAfterDiscounts = props.effectiveTuitionAmount - scholarshipAmount - discountAmount;
    const finalAmount = amountAfterDiscounts + extraAmount + lateFeeAmount;

    const dueDate = new Date(props.billingYear, props.billingMonth - 1, props.dueDay);

    return new BillingRecord(
      props.id,
      props.studentId,
      props.schoolYearId,
      props.billingMonth,
      props.billingYear,
      props.tuitionTypeSnapshot,
      props.effectiveTuitionAmount,
      scholarshipAmount,
      discountAdjustments,
      extraCharges,
      lateFeeAmount,
      finalAmount,
      props.billStatus ?? 'not_required',
      'pending',
      0,
      null,
      null,
      {
        createdBy: props.createdBy,
      },
      null,
      null,
      null,
      null,
      null,
      null,
      dueDate,
      new Date(),
      new Date()
    );
  }

  static calculateDiscountAmount(adjustments: DiscountAdjustment[], baseAmount: number): number {
    return adjustments.reduce((total, adjustment) => {
      if (adjustment.type === 'percentage') {
        return total + (baseAmount * adjustment.value) / 100;
      }
      return total + adjustment.value;
    }, 0);
  }

  static calculateExtraAmount(charges: ExtraCharge[]): number {
    return charges.reduce((total, charge) => total + charge.amount, 0);
  }

  static calculateLateFee(amountAfterDiscounts: number, snapshot: TuitionTypeSnapshot): number {
    if (snapshot.lateFeeType === 'fixed') {
      return snapshot.lateFeeValue;
    }
    return amountAfterDiscounts * (snapshot.lateFeeValue / 100);
  }

  markAsPaid(props: {
    paymentMethod: PaymentMethod;
    paymentNote?: string;
    paidBy: string;
    paymentGateway?: string;
    paymentTransactionId?: string;
    paymentGatewayStatus?: string;
  }): BillingRecord {
    if (this.paymentStatus === 'paid') {
      throw new Error('Bill is already marked as paid');
    }
    if (this.lockedAt !== null) {
      throw new Error('Cannot mark a locked bill as paid');
    }

    const now = new Date();
    const newAuditMetadata = {
      ...this.auditMetadata,
      paidBy: props.paidBy,
      updatedBy: props.paidBy,
    };

    return new BillingRecord(
      this.id,
      this.studentId,
      this.schoolYearId,
      this.billingMonth,
      this.billingYear,
      this.tuitionTypeSnapshot,
      this.effectiveTuitionAmount,
      this.scholarshipAmount,
      this.discountAdjustments,
      this.extraCharges,
      this.lateFeeAmount,
      this.finalAmount,
      this.billStatus,
      'paid',
      this.finalAmount,
      now,
      now,
      newAuditMetadata,
      props.paymentNote ?? null,
      props.paymentMethod,
      props.paymentGateway ?? null,
      props.paymentTransactionId ?? null,
      props.paymentGatewayStatus ?? null,
      props.paymentGateway ? now : null,
      this.dueDate,
      this.createdAt,
      new Date()
    );
  }

  updateTaxableBillStatus(newStatus: TaxableBillStatus, updatedBy: string): BillingRecord {
    // Allow updating taxable bill status for paid bills even if locked
    if (this.lockedAt !== null && this.paymentStatus !== 'paid') {
      throw new Error('Cannot change taxable bill status of a locked record');
    }

    const newAuditMetadata = {
      ...this.auditMetadata,
      statusChangedBy: updatedBy,
      updatedBy,
    };

    return new BillingRecord(
      this.id,
      this.studentId,
      this.schoolYearId,
      this.billingMonth,
      this.billingYear,
      this.tuitionTypeSnapshot,
      this.effectiveTuitionAmount,
      this.scholarshipAmount,
      this.discountAdjustments,
      this.extraCharges,
      this.lateFeeAmount,
      this.finalAmount,
      newStatus,
      this.paymentStatus,
      this.paidAmount,
      this.paidAt,
      this.lockedAt,
      newAuditMetadata,
      this.paymentNote,
      this.paymentMethod,
      this.paymentGateway,
      this.paymentTransactionId,
      this.paymentGatewayStatus,
      this.paymentWebhookReceivedAt,
      this.dueDate,
      this.createdAt,
      new Date()
    );
  }

  // Keep for backward compatibility
  updateBillStatus(newStatus: BillStatus, updatedBy: string): BillingRecord {
    return this.updateTaxableBillStatus(newStatus, updatedBy);
  }

  recordPartialPayment(props: {
    amount: number;
    paymentMethod: PaymentMethod;
    paymentNote?: string;
    paidBy: string;
  }): BillingRecord {
    if (this.paymentStatus === 'paid') {
      throw new Error('Bill is already fully paid');
    }
    if (this.lockedAt !== null) {
      throw new Error('Cannot record partial payment on a locked bill');
    }
    if (props.amount <= 0) {
      throw new Error('Partial payment amount must be greater than 0');
    }
    if (props.amount >= this.finalAmount) {
      throw new Error('Partial payment amount must be less than final amount. Use markAsPaid for full payment.');
    }

    const newPaidAmount = this.paidAmount + props.amount;
    if (newPaidAmount >= this.finalAmount) {
      // If this payment makes it fully paid, mark as paid
      return this.markAsPaid({
        paymentMethod: props.paymentMethod,
        paymentNote: props.paymentNote,
        paidBy: props.paidBy,
      });
    }

    const newAuditMetadata = {
      ...this.auditMetadata,
      paidBy: props.paidBy,
      updatedBy: props.paidBy,
    };

    return new BillingRecord(
      this.id,
      this.studentId,
      this.schoolYearId,
      this.billingMonth,
      this.billingYear,
      this.tuitionTypeSnapshot,
      this.effectiveTuitionAmount,
      this.scholarshipAmount,
      this.discountAdjustments,
      this.extraCharges,
      this.lateFeeAmount,
      this.finalAmount,
      this.billStatus,
      'partial_payment',
      newPaidAmount,
      this.paidAt,
      this.lockedAt,
      newAuditMetadata,
      props.paymentNote ?? this.paymentNote,
      props.paymentMethod,
      this.paymentGateway,
      this.paymentTransactionId,
      this.paymentGatewayStatus,
      this.paymentWebhookReceivedAt,
      this.dueDate,
      this.createdAt,
      new Date()
    );
  }

  markAsDelayed(): BillingRecord {
    if (this.paymentStatus === 'paid') {
      return this; // Already paid, no need to mark as delayed
    }
    if (this.paymentStatus === 'delayed') {
      return this; // Already delayed
    }
    if (this.lockedAt !== null) {
      return this; // Locked records shouldn't be auto-updated
    }

    const now = new Date();
    if (now <= this.dueDate) {
      return this; // Not past due date yet
    }

    const newAuditMetadata = {
      ...this.auditMetadata,
      updatedBy: this.auditMetadata.updatedBy || 'system',
    };

    return new BillingRecord(
      this.id,
      this.studentId,
      this.schoolYearId,
      this.billingMonth,
      this.billingYear,
      this.tuitionTypeSnapshot,
      this.effectiveTuitionAmount,
      this.scholarshipAmount,
      this.discountAdjustments,
      this.extraCharges,
      this.lateFeeAmount,
      this.finalAmount,
      this.billStatus,
      'delayed',
      this.paidAmount,
      this.paidAt,
      this.lockedAt,
      newAuditMetadata,
      this.paymentNote,
      this.paymentMethod,
      this.paymentGateway,
      this.paymentTransactionId,
      this.paymentGatewayStatus,
      this.paymentWebhookReceivedAt,
      this.dueDate,
      this.createdAt,
      new Date()
    );
  }

  applyLateFee(amountAfterDiscounts: number, appliedBy: string): BillingRecord {
    if (this.lateFeeAmount > 0) {
      throw new Error('Late fee has already been applied to this bill');
    }
    if (this.lockedAt !== null) {
      throw new Error('Cannot apply late fee to a locked bill');
    }

    const newLateFeeAmount = BillingRecord.calculateLateFee(amountAfterDiscounts, this.tuitionTypeSnapshot);
    const extraAmount = BillingRecord.calculateExtraAmount(this.extraCharges);
    const amountAfterDiscountsAndScholarship = this.effectiveTuitionAmount - this.scholarshipAmount - BillingRecord.calculateDiscountAmount(this.discountAdjustments, this.effectiveTuitionAmount - this.scholarshipAmount);
    const newFinalAmount = amountAfterDiscountsAndScholarship + extraAmount + newLateFeeAmount;

    const newAuditMetadata = {
      ...this.auditMetadata,
      lateFeeAppliedBy: appliedBy,
      updatedBy: appliedBy,
    };

    return new BillingRecord(
      this.id,
      this.studentId,
      this.schoolYearId,
      this.billingMonth,
      this.billingYear,
      this.tuitionTypeSnapshot,
      this.effectiveTuitionAmount,
      this.scholarshipAmount,
      this.discountAdjustments,
      this.extraCharges,
      newLateFeeAmount,
      newFinalAmount,
      this.billStatus,
      this.paymentStatus,
      this.paidAmount,
      this.paidAt,
      this.lockedAt,
      newAuditMetadata,
      this.paymentNote,
      this.paymentMethod,
      this.paymentGateway,
      this.paymentTransactionId,
      this.paymentGatewayStatus,
      this.paymentWebhookReceivedAt,
      this.dueDate,
      this.createdAt,
      new Date()
    );
  }

  update(props: {
    effectiveTuitionAmount?: number;
    discountAdjustments?: DiscountAdjustment[];
    extraCharges?: ExtraCharge[];
    billStatus?: BillStatus;
    updatedBy: string;
  }): BillingRecord {
    if (this.lockedAt !== null) {
      throw new Error('Cannot update a locked billing record');
    }

    const newEffectiveTuitionAmount = props.effectiveTuitionAmount ?? this.effectiveTuitionAmount;
    const newDiscountAdjustments = props.discountAdjustments ?? this.discountAdjustments;
    const newExtraCharges = props.extraCharges ?? this.extraCharges;
    const newBillStatus = props.billStatus ?? this.billStatus;

    const discountAmount = BillingRecord.calculateDiscountAmount(newDiscountAdjustments, newEffectiveTuitionAmount - this.scholarshipAmount);
    const extraAmount = BillingRecord.calculateExtraAmount(newExtraCharges);
    const amountAfterDiscounts = newEffectiveTuitionAmount - this.scholarshipAmount - discountAmount;
    const newFinalAmount = amountAfterDiscounts + extraAmount + this.lateFeeAmount;

    const newAuditMetadata = {
      ...this.auditMetadata,
      updatedBy: props.updatedBy,
      statusChangedBy: props.billStatus && props.billStatus !== this.billStatus ? props.updatedBy : this.auditMetadata.statusChangedBy,
    };

    return new BillingRecord(
      this.id,
      this.studentId,
      this.schoolYearId,
      this.billingMonth,
      this.billingYear,
      this.tuitionTypeSnapshot,
      newEffectiveTuitionAmount,
      this.scholarshipAmount,
      newDiscountAdjustments,
      newExtraCharges,
      this.lateFeeAmount,
      newFinalAmount,
      newBillStatus,
      this.paymentStatus,
      this.paidAmount,
      this.paidAt,
      this.lockedAt,
      newAuditMetadata,
      this.paymentNote,
      this.paymentMethod,
      this.paymentGateway,
      this.paymentTransactionId,
      this.paymentGatewayStatus,
      this.paymentWebhookReceivedAt,
      this.dueDate,
      this.createdAt,
      new Date()
    );
  }

  get isOverdue(): boolean {
    if (this.paymentStatus === 'paid') {
      return false;
    }
    const now = new Date();
    return now > this.dueDate;
  }

  get isPaid(): boolean {
    return this.paymentStatus === 'paid';
  }

  get canEdit(): boolean {
    return this.lockedAt === null;
  }

  get isLocked(): boolean {
    return this.lockedAt !== null;
  }
}
