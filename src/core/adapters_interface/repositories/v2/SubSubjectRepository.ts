import { SubSubject } from '../../../domain/entities/v2/SubSubject';
import { PrismaTransaction } from '../../../frameworks/database/PrismaTransaction';

export interface SubSubjectRepository {
  findById(id: string, tx?: PrismaTransaction): Promise<SubSubject | null>;
  findManyByIds(ids: string[], tx?: PrismaTransaction): Promise<SubSubject[]>;
}