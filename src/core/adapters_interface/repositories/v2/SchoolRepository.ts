import { School } from '../../../domain/entities/v2/School';

export interface SchoolRepository {
  findById(id: string): Promise<School | null>;
}