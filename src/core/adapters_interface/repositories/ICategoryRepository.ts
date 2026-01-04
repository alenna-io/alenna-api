import { Category } from '../../domain/entities';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findByIdWithSubSubjects(id: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findAllWithSubSubjects(): Promise<Category[]>;
  create(category: Category): Promise<Category>;
  update(id: string, category: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<void>;
}