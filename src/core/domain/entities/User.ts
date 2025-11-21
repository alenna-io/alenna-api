// Domain Entity: User
export type UserRole = 'SUPERADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export interface UserRoleInfo {
  id: string;
  name: string;
  displayName: string;
}

export class User {
  constructor(
    public readonly id: string,
    public readonly clerkId: string | null,
    public readonly email: string,
    public readonly schoolId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly language?: string,
    public readonly isActive: boolean = true,
    public readonly roles: UserRoleInfo[] = [],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    clerkId?: string | null;
    email: string;
    schoolId: string;
    firstName?: string;
    lastName?: string;
    language?: string;
    isActive?: boolean;
    roles?: UserRoleInfo[];
  }): User {
    return new User(
      props.id,
      props.clerkId ?? null,
      props.email,
      props.schoolId,
      props.firstName,
      props.lastName,
      props.language,
      props.isActive ?? true,
      props.roles || [],
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Pick<User, 'firstName' | 'lastName' | 'language' | 'isActive' | 'roles' | 'email' | 'schoolId'>>): User {
    return new User(
      this.id,
      this.clerkId,
      props.email ?? this.email,
      props.schoolId ?? this.schoolId,
      props.firstName ?? this.firstName,
      props.lastName ?? this.lastName,
      props.language ?? this.language,
      props.isActive !== undefined ? props.isActive : this.isActive,
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

  isSchoolAdmin(): boolean {
    return this.hasRole('SCHOOL_ADMIN');
  }

  canManageUsers(): boolean {
    return this.hasRole('SUPERADMIN') || this.hasRole('SCHOOL_ADMIN');
  }

  canManageStudents(): boolean {
    return this.hasRole('SUPERADMIN') || this.hasRole('SCHOOL_ADMIN') || this.hasRole('TEACHER');
  }

  get primaryRole(): UserRoleInfo | undefined {
    // Return the highest priority role
    const priorityOrder = ['SUPERADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'];
    for (const roleName of priorityOrder) {
      const role = this.roles.find(r => r.name === roleName);
      if (role) return role;
    }
    return this.roles[0];
  }
}

