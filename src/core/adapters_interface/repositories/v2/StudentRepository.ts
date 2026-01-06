import { Student } from '../../../domain/entities/v2/Student';
import { PrismaTransaction } from '../../../frameworks/database/PrismaTransaction';

export interface StudentRepository {
  findById(id: string, tx?: PrismaTransaction): Promise<Student | null>;
}