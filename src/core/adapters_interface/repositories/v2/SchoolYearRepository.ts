import { SchoolYear } from '../../../domain/entities/v2/SchoolYear';

export interface SchoolYearRepository {
  findById(id: string): Promise<SchoolYear | null>;
}