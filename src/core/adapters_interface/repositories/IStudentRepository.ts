import { Student } from '../../domain/entities';

export interface IStudentRepository {
  findById(id: string, schoolId: string): Promise<Student | null>;
  findBySchoolId(schoolId: string): Promise<Student[]>;
  create(student: Student): Promise<Student>;
  createWithUser(student: Student, userId: string): Promise<Student>;
  update(id: string, student: Partial<Student>, schoolId: string): Promise<Student>;
  delete(id: string, schoolId: string): Promise<void>;
}

