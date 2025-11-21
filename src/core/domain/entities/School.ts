// Domain Entity: School (Tenant)
export class School {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly address?: string,
    public readonly phone?: string,
    public readonly email?: string,
    public readonly teacherLimit?: number,
    public readonly userLimit?: number,
    public readonly isActive: boolean = true,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    teacherLimit?: number;
    userLimit?: number;
    isActive?: boolean;
  }): School {
    return new School(
      props.id,
      props.name,
      props.address,
      props.phone,
      props.email,
      props.teacherLimit,
      props.userLimit,
      props.isActive ?? true,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Pick<School, 'name' | 'address' | 'phone' | 'email' | 'teacherLimit' | 'userLimit' | 'isActive'>>): School {
    return new School(
      this.id,
      props.name ?? this.name,
      props.address ?? this.address,
      props.phone ?? this.phone,
      props.email ?? this.email,
      props.teacherLimit ?? this.teacherLimit,
      props.userLimit ?? this.userLimit,
      props.isActive !== undefined ? props.isActive : this.isActive,
      this.createdAt,
      new Date()
    );
  }
}

