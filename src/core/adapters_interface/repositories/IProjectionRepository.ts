import { Projection } from '../../domain/entities';

export interface IProjectionRepository {
  findById(id: string, studentId: string): Promise<Projection | null>;
  findByStudentId(studentId: string): Promise<Projection[]>;
  findActiveByStudentId(studentId: string): Promise<Projection | null>;
  create(projection: Projection): Promise<Projection>;
  update(id: string, data: Partial<Projection>, studentId: string): Promise<Projection>;
  delete(id: string, studentId: string): Promise<void>;
}

