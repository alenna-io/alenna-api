export type LateFeeType = 'fixed' | 'percentage';

export class TuitionType {
  constructor(
    public readonly id: string,
    public readonly schoolId: string,
    public readonly name: string,
    public readonly baseAmount: number,
    public readonly currency: string,
    public readonly lateFeeType: LateFeeType,
    public readonly lateFeeValue: number,
    public readonly displayOrder: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {
    if (baseAmount < 0) {
      throw new Error('Base amount cannot be negative');
    }
    if (lateFeeValue < 0) {
      throw new Error('Late fee value cannot be negative');
    }
    if (lateFeeType === 'percentage' && lateFeeValue > 100) {
      throw new Error('Late fee percentage cannot exceed 100');
    }
  }

  static create(props: {
    id: string;
    schoolId: string;
    name: string;
    baseAmount: number;
    currency?: string;
    lateFeeType: LateFeeType;
    lateFeeValue: number;
    displayOrder?: number;
  }): TuitionType {
    return new TuitionType(
      props.id,
      props.schoolId,
      props.name,
      props.baseAmount,
      props.currency ?? 'USD',
      props.lateFeeType,
      props.lateFeeValue,
      props.displayOrder ?? 0,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Omit<TuitionType, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>>): TuitionType {
    return new TuitionType(
      this.id,
      this.schoolId,
      props.name ?? this.name,
      props.baseAmount ?? this.baseAmount,
      props.currency ?? this.currency,
      props.lateFeeType ?? this.lateFeeType,
      props.lateFeeValue ?? this.lateFeeValue,
      props.displayOrder ?? this.displayOrder,
      this.createdAt,
      new Date()
    );
  }

  calculateLateFee(amountAfterDiscounts: number): number {
    if (this.lateFeeType === 'fixed') {
      return this.lateFeeValue;
    }
    return amountAfterDiscounts * (this.lateFeeValue / 100);
  }
}

