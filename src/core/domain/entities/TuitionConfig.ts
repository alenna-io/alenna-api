export class TuitionConfig {
  constructor(
    public readonly id: string,
    public readonly schoolId: string,
    public readonly dueDay: number,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {
    if (dueDay < 1 || dueDay > 31) {
      throw new Error('Due day must be between 1 and 31');
    }
  }

  static create(props: {
    id: string;
    schoolId: string;
    dueDay?: number;
  }): TuitionConfig {
    return new TuitionConfig(
      props.id,
      props.schoolId,
      props.dueDay ?? 5,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Omit<TuitionConfig, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>>): TuitionConfig {
    return new TuitionConfig(
      this.id,
      this.schoolId,
      props.dueDay ?? this.dueDay,
      this.createdAt,
      new Date()
    );
  }
}

