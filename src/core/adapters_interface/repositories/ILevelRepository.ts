import { Level } from '../../domain/entities';

export interface ILevelRepository {
  findById(id: string): Promise<Level | null>;
  findByIdWithSubSubjects(id: string): Promise<Level | null>;
  findAll(): Promise<Level[]>;
  findAllWithSubSubjects(): Promise<Level[]>;
  create(level: Level): Promise<Level>;
  update(id: string, level: Partial<Level>): Promise<Level>;
  delete(id: string): Promise<void>;
}