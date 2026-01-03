import { StudentScholarship } from '../../domain/entities';

export interface IStudentScholarshipRepository {
  findByStudentId(studentId: string, schoolId: string): Promise<StudentScholarship | null>;
  findBySchoolId(schoolId: string): Promise<StudentScholarship[]>;
  create(scholarship: StudentScholarship): Promise<StudentScholarship>;
  update(id: string, scholarship: Partial<StudentScholarship>, schoolId: string): Promise<StudentScholarship>;
  delete(id: string, schoolId: string): Promise<void>;
}

