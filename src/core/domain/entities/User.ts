// Domain Entity: User
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export interface UserRoleInfo {
  id: string;
  name: string;
  displayName: string;
}

export class User {
  constructor(
    public readonly id: string,
    public readonly clerkId: string,
    public readonly email: string,
    public readonly schoolId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly roles: UserRoleInfo[] = [],
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
    roles?: UserRoleInfo[];
  }): User {
    return new User(
      props.id,
      props.clerkId,
      props.email,
      props.schoolId,
      props.firstName,
      props.lastName,
      props.roles || [],
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Pick<User, 'firstName' | 'lastName' | 'roles' | 'email' | 'schoolId'>>): User {
    return new User(
      this.id,
      this.clerkId,
      props.email ?? this.email,
      props.schoolId ?? this.schoolId,
      props.firstName ?? this.firstName,
      props.lastName ?? this.lastName,
      props.roles ?? this.roles,
      this.createdAt,
      new Date()
    );
  }

  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.email;
  }

  hasRole(roleName: string): boolean {
    return this.roles.some(role => role.name === roleName);
  }

  isSuperAdmin(): boolean {
    return this.hasRole('SUPERADMIN');
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  canManageUsers(): boolean {
    return this.hasRole('SUPERADMIN') || this.hasRole('ADMIN');
  }

  canManageStudents(): boolean {
    return this.hasRole('SUPERADMIN') || this.hasRole('ADMIN') || this.hasRole('TEACHER');
  }

  get primaryRole(): UserRoleInfo | undefined {
    // Return the highest priority role
    const priorityOrder = ['SUPERADMIN', 'ADMIN', 'TEACHER', 'PARENT', 'STUDENT'];
    for (const roleName of priorityOrder) {
      const role = this.roles.find(r => r.name === roleName);
      if (role) return role;
    }
    return this.roles[0];
  }
}

