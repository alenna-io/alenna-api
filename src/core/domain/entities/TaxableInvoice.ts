export class TaxableInvoice {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly taxable: boolean,
    public readonly pdfFileUrl: string | null,
    public readonly xmlFileUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) { }

  static create(props: {
    id: string;
    studentId: string;
    taxable: boolean;
    pdfFileUrl: string | null;
    xmlFileUrl: string | null;
  }): TaxableInvoice {
    return new TaxableInvoice(
      props.id,
      props.studentId,
      props.taxable,
      props.pdfFileUrl,
      props.xmlFileUrl,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Pick<TaxableInvoice, 'taxable' | 'pdfFileUrl' | 'xmlFileUrl'>>): TaxableInvoice {
    return new TaxableInvoice(
      this.id,
      this.studentId,
      props.taxable ?? this.taxable,
      props.pdfFileUrl ?? this.pdfFileUrl,
      props.xmlFileUrl ?? this.xmlFileUrl,
      this.createdAt,
      new Date()
    );
  }

  softDelete(): TaxableInvoice {
    return new TaxableInvoice(
      this.id,
      this.studentId,
      this.taxable,
      this.pdfFileUrl,
      this.xmlFileUrl,
      this.createdAt,
      new Date()
    );
  }
}