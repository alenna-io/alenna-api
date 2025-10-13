// Domain Entity: School (Tenant)
export class School {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly address?: string,
    public readonly phone?: string,
    public readonly email?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  }): School {
    return new School(
      props.id,
      props.name,
      props.address,
      props.phone,
      props.email,
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Pick<School, 'name' | 'address' | 'phone' | 'email'>>): School {
    return new School(
      this.id,
      props.name ?? this.name,
      props.address ?? this.address,
      props.phone ?? this.phone,
      props.email ?? this.email,
      this.createdAt,
      new Date()
    );
  }
}

