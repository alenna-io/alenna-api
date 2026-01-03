export type ScholarshipType = 'percentage' | 'fixed';

export class StudentScholarship {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly tuitionTypeId: string | null,
    public readonly scholarshipType: ScholarshipType | null,
    public readonly scholarshipValue: number | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {
    if (scholarshipType === 'percentage' && scholarshipValue !== null && (scholarshipValue < 0 || scholarshipValue > 100)) {
      throw new Error('Percentage scholarship must be between 0 and 100');
    }
    if (scholarshipType === 'fixed' && scholarshipValue !== null && scholarshipValue < 0) {
      throw new Error('Fixed scholarship amount cannot be negative');
    }
  }

  static create(props: {
    id: string;
    studentId: string;
    tuitionTypeId?: string | null;
    scholarshipType?: ScholarshipType | null;
    scholarshipValue?: number | null;
  }): StudentScholarship {
    return new StudentScholarship(
      props.id,
      props.studentId,
      props.tuitionTypeId ?? null,
      props.scholarshipType ?? null,
      props.scholarshipValue ?? null,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Omit<StudentScholarship, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>>): StudentScholarship {
    return new StudentScholarship(
      this.id,
      this.studentId,
      props.tuitionTypeId !== undefined ? props.tuitionTypeId : this.tuitionTypeId,
      props.scholarshipType !== undefined ? props.scholarshipType : this.scholarshipType,
      props.scholarshipValue !== undefined ? props.scholarshipValue : this.scholarshipValue,
      this.createdAt,
      new Date()
    );
  }

  calculateDiscount(baseAmount: number): number {
    if (!this.scholarshipType || this.scholarshipValue === null) {
      return 0;
    }
    if (this.scholarshipType === 'percentage') {
      return (baseAmount * this.scholarshipValue) / 100;
    }
    return this.scholarshipValue;
  }
}

