import { School } from '../../../domain/entities/v2/School';
import { PrismaTransaction } from '../../../frameworks/database/PrismaTransaction';

export interface SchoolRepository {
  findById(id: string, tx?: PrismaTransaction): Promise<School | null>;
}