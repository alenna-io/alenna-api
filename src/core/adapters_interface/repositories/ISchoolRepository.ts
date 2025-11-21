import { School } from '../../domain/entities';

export interface ISchoolRepository {
  findById(id: string): Promise<School | null>;
  findAll(): Promise<School[]>;
  create(school: School): Promise<School>;
  update(id: string, school: Partial<School>): Promise<School>;
  activate(id: string): Promise<School>;
  deactivate(id: string): Promise<School>;
  delete(id: string): Promise<void>;
}

