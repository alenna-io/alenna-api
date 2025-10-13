// Domain Entity: User
export type UserRole = 'ADMIN' | 'TEACHER' | 'SUPERVISOR';

export class User {
  constructor(
    public readonly id: string,
    public readonly clerkId: string,
    public readonly email: string,
    public readonly schoolId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly role: UserRole = 'TEACHER',
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    clerkId: string;
    email: string;
    schoolId: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
  }): User {
    return new User(
      props.id,
      props.clerkId,
      props.email,
      props.schoolId,
      props.firstName,
      props.lastName,
      props.role || 'TEACHER',
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Pick<User, 'firstName' | 'lastName' | 'role' | 'email'>>): User {
    return new User(
      this.id,
      this.clerkId,
      props.email ?? this.email,
      this.schoolId,
      props.firstName ?? this.firstName,
      props.lastName ?? this.lastName,
      props.role ?? this.role,
      this.createdAt,
      new Date()
    );
  }

  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.email;
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  canManageUsers(): boolean {
    return this.role === 'ADMIN';
  }

  canManageStudents(): boolean {
    return ['ADMIN', 'TEACHER', 'SUPERVISOR'].includes(this.role);
  }
}

