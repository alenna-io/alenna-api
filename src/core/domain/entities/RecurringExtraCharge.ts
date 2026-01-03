export class RecurringExtraCharge {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly description: string,
    public readonly amount: number,
    public readonly expiresAt: Date,
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    if (description.length === 0 || description.length > 100) {
      throw new Error('Description must be between 1 and 100 characters');
    }
  }

  static create(props: {
    id: string;
    studentId: string;
    description: string;
    amount: number;
    expiresAt: Date;
  }): RecurringExtraCharge {
    const now = new Date();
    return new RecurringExtraCharge(
      props.id,
      props.studentId,
      props.description,
      props.amount,
      props.expiresAt,
      null,
      now,
      now
    );
  }

  update(props: Partial<{
    description: string;
    amount: number;
    expiresAt: Date;
  }>): RecurringExtraCharge {
    return new RecurringExtraCharge(
      this.id,
      this.studentId,
      props.description ?? this.description,
      props.amount ?? this.amount,
      props.expiresAt ?? this.expiresAt,
      this.deletedAt,
      this.createdAt,
      new Date()
    );
  }

  isActive(billingMonth: number, billingYear: number): boolean {
    const billingDate = new Date(billingYear, billingMonth - 1, 1);
    return this.expiresAt >= billingDate && this.deletedAt === null;
  }

  softDelete(): RecurringExtraCharge {
    return new RecurringExtraCharge(
      this.id,
      this.studentId,
      this.description,
      this.amount,
      this.expiresAt,
      new Date(),
      this.createdAt,
      new Date()
    );
  }
}

