export class StudentBillingConfig {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly requiresTaxableInvoice: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) { }

  static create(props: {
    id: string;
    studentId: string;
    requiresTaxableInvoice: boolean;
  }): StudentBillingConfig {
    return new StudentBillingConfig(
      props.id,
      props.studentId,
      props.requiresTaxableInvoice,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Pick<StudentBillingConfig, 'requiresTaxableInvoice'>>): StudentBillingConfig {
    return new StudentBillingConfig(
      this.id,
      this.studentId,
      props.requiresTaxableInvoice ?? this.requiresTaxableInvoice,
      this.createdAt,
      new Date()
    );
  }

  softDelete(): StudentBillingConfig {
    return new StudentBillingConfig(
      this.id,
      this.studentId,
      this.requiresTaxableInvoice,
      this.createdAt,
      new Date()
    );
  }
}