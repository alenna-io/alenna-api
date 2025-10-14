// Domain Entity: CertificationType
export class CertificationType {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly schoolId: string,
    public readonly description?: string,
    public readonly isActive: boolean = true,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    name: string;
    schoolId: string;
    description?: string;
    isActive?: boolean;
  }): CertificationType {
    return new CertificationType(
      props.id,
      props.name,
      props.schoolId,
      props.description,
      props.isActive ?? true,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Omit<CertificationType, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>>): CertificationType {
    return new CertificationType(
      this.id,
      props.name ?? this.name,
      this.schoolId,
      props.description ?? this.description,
      props.isActive ?? this.isActive,
      this.createdAt,
      new Date()
    );
  }
}

