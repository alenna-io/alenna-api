import { CharacterTrait } from '../../domain/entities/CharacterTrait';

export interface ICharacterTraitRepository {
  create(data: Omit<CharacterTrait, 'id' | 'createdAt' | 'updatedAt'>): Promise<CharacterTrait>;
  update(id: string, data: Partial<Omit<CharacterTrait, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>>): Promise<CharacterTrait>;
  findById(id: string): Promise<CharacterTrait | null>;
  findBySchoolYear(schoolYearId: string): Promise<CharacterTrait[]>;
  findBySchoolYearAndMonth(schoolYearId: string, month: number): Promise<CharacterTrait | null>;
  delete(id: string): Promise<void>;
}

