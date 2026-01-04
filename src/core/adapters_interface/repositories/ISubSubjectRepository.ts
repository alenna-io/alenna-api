import { SubSubject } from '../../domain/entities';

export interface ISubSubjectRepository {
  findById(id: string): Promise<SubSubject | null>;
  findBySubjectNameAndCategoryId(name: string, categoryId: string): Promise<SubSubject | null>;
  findByIdWithPaces(id: string): Promise<SubSubject | null>;
  findAllByCategoryId(categoryId: string): Promise<SubSubject[]>;
  findAllByLevelId(levelId: string): Promise<SubSubject[]>;
  findAll(): Promise<SubSubject[]>;
  create(subSubject: SubSubject): Promise<SubSubject>;
  update(id: string, subSubject: Partial<SubSubject>): Promise<SubSubject>;
  delete(id: string): Promise<void>;
}