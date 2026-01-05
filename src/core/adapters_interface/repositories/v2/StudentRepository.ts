import { Student } from '../../../domain/entities/v2/Student';

export interface StudentRepository {
  findById(id: string): Promise<Student | null>;
}