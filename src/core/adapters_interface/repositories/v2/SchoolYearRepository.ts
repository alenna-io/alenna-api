import { SchoolYear } from '../../../domain/entities/v2/SchoolYear';
import { PrismaTransaction } from '../../../frameworks/database/PrismaTransaction';

export interface SchoolYearRepository {
  findById(id: string, tx?: PrismaTransaction): Promise<SchoolYear | null>;
}