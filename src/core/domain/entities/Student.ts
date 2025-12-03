import { CertificationType } from './CertificationType';

// Domain Entity: Student
export interface Parent {
  id: string;
  name: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  relationship?: string;
}

export class Student {
  constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly age: number,
    public readonly birthDate: Date,
    public readonly certificationTypeId: string,
    public readonly certificationType: CertificationType,
    public readonly graduationDate: Date,
    public readonly schoolId: string,
    public readonly isActive: boolean,
    public readonly contactPhone?: string,
    public readonly isLeveled: boolean = false,
    public readonly expectedLevel?: string,
    public readonly currentLevel?: string,
    public readonly address?: string,
    public readonly streetAddress?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly country?: string,
    public readonly zipCode?: string,
    public readonly parents: Parent[] = [],
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  static create(props: {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    birthDate: Date;
    certificationTypeId: string;
    certificationType: CertificationType;
    graduationDate: Date;
    schoolId: string;
    isActive?: boolean;
    contactPhone?: string;
    isLeveled?: boolean;
    expectedLevel?: string;
    currentLevel?: string;
    address?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    parents?: Parent[];
  }): Student {
    return new Student(
      props.id,
      props.firstName,
      props.lastName,
      props.age,
      props.birthDate,
      props.certificationTypeId,
      props.certificationType,
      props.graduationDate,
      props.schoolId,
      props.isActive ?? true,
      props.contactPhone,
      props.isLeveled || false,
      props.expectedLevel,
      props.currentLevel,
      props.address,
      props.streetAddress,
      props.city,
      props.state,
      props.country,
      props.zipCode,
      props.parents || [],
      new Date(),
      new Date()
    );
  }

  update(props: Partial<Omit<Student, 'id' | 'schoolId' | 'createdAt' | 'updatedAt' | 'isActive'>>): Student {
    return new Student(
      this.id,
      props.firstName ?? this.firstName,
      props.lastName ?? this.lastName,
      props.age ?? this.age,
      props.birthDate ?? this.birthDate,
      props.certificationTypeId ?? this.certificationTypeId,
      props.certificationType ?? this.certificationType,
      props.graduationDate ?? this.graduationDate,
      this.schoolId,
      this.isActive,
      props.contactPhone ?? this.contactPhone,
      props.isLeveled ?? this.isLeveled,
      props.expectedLevel ?? this.expectedLevel,
      props.currentLevel ?? this.currentLevel,
      props.address ?? this.address,
      props.streetAddress ?? this.streetAddress,
      props.city ?? this.city,
      props.state ?? this.state,
      props.country ?? this.country,
      props.zipCode ?? this.zipCode,
      props.parents ?? this.parents,
      this.createdAt,
      new Date()
    );
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isGraduating(): boolean {
    const now = new Date();
    const monthsUntilGraduation = (this.graduationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsUntilGraduation <= 6 && monthsUntilGraduation >= 0;
  }
}

