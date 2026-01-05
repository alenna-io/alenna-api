import { Projection, ProjectionPace, GradeHistory, PaceCatalog, SubSubject, Category } from '../../domain/entities';

export interface ProjectionPaceWithDetails extends ProjectionPace {
  gradeHistory: GradeHistory[];
  paceCatalog: PaceCatalog & {
    subSubject: SubSubject & {
      category: Category;
    };
  };
}

export interface ProjectionWithPaces {
  projection: Projection;
  projectionPaces: ProjectionPaceWithDetails[];
  categories?: Category[];
}

export interface IProjectionRepository {
  findById(id: string, studentId: string): Promise<Projection | null>;
  findByIdWithStudent(id: string, studentId: string): Promise<any | null>;
  findByIdWithPaces(id: string, studentId: string): Promise<ProjectionWithPaces | null>;
  findByStudentId(studentId: string): Promise<Projection[]>;
  findActiveByStudentId(studentId: string): Promise<Projection | null>;
  findByStudentIdAndSchoolYear(studentId: string, schoolYear: string): Promise<Projection | null>;
  create(projection: Projection): Promise<Projection>;
  update(id: string, data: Partial<Projection>, studentId: string): Promise<Projection>;
  delete(id: string, studentId: string): Promise<void>;
  hardDelete(id: string, studentId: string): Promise<void>;
}

