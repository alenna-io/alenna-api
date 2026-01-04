import { PaceCatalog } from '../../domain/entities';

export interface IPaceCatalogRepository {
  findById(id: string): Promise<PaceCatalog | null>;
  findAllBySubSubjectId(subSubjectId: string): Promise<PaceCatalog[]>;
  createMany(paceCatalogs: PaceCatalog[]): Promise<PaceCatalog[]>;
  create(paceCatalog: PaceCatalog): Promise<PaceCatalog>;
  update(id: string, paceCatalog: Partial<PaceCatalog>): Promise<PaceCatalog>;
  delete(id: string): Promise<void>;
}