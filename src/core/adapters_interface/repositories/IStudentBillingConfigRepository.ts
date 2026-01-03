import { StudentBillingConfig } from '../../domain/entities';

export interface IStudentBillingConfigRepository {
  findBySchoolId(schoolId: string): Promise<StudentBillingConfig[]>;
  findByStudentId(studentId: string): Promise<StudentBillingConfig | null>;
  findById(id: string): Promise<StudentBillingConfig | null>;
  create(studentBillingConfig: StudentBillingConfig): Promise<StudentBillingConfig>;
  update(id: string, studentBillingConfig: Partial<StudentBillingConfig>): Promise<StudentBillingConfig>;
  delete(id: string): Promise<void>;
}