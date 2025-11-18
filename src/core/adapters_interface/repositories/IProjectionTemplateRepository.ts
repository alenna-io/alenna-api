export interface ProjectionTemplateSubject {
  id: string;
  subSubjectId: string;
  subSubjectName: string;
  startPace: number;
  endPace: number;
  skipPaces: number[];
  notPairWith: string[];
  extendToNext: boolean;
  order: number;
}

export interface ProjectionTemplate {
  id: string;
  name: string;
  level: string; // L1, L2, etc.
  isDefault: boolean;
  isActive: boolean;
  schoolId: string;
  templateSubjects: ProjectionTemplateSubject[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectionTemplateRepository {
  findById(id: string, schoolId: string): Promise<ProjectionTemplate | null>;
  findBySchoolId(schoolId: string): Promise<ProjectionTemplate[]>;
  findByLevel(schoolId: string, level: string): Promise<ProjectionTemplate[]>;
  findDefaultByLevel(schoolId: string, level: string): Promise<ProjectionTemplate | null>;
  create(template: Omit<ProjectionTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectionTemplate>;
  update(id: string, schoolId: string, data: Partial<ProjectionTemplate>): Promise<ProjectionTemplate>;
  delete(id: string, schoolId: string): Promise<void>;
}

