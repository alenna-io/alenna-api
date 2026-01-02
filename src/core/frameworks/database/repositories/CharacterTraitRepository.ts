import { ICharacterTraitRepository } from '../../../adapters_interface/repositories/ICharacterTraitRepository';
import { CharacterTrait } from '../../../domain/entities/CharacterTrait';
import prisma from '../prisma.client';

export class CharacterTraitRepository implements ICharacterTraitRepository {
  async create(data: Omit<CharacterTrait, 'id' | 'createdAt' | 'updatedAt'>): Promise<CharacterTrait> {
    const characterTrait = await prisma.characterTrait.create({
      data: {
        schoolId: data.schoolId,
        schoolYearId: data.schoolYearId,
        month: data.month,
        characterTrait: data.characterTrait,
        verseText: data.verseText,
        verseReference: data.verseReference,
      },
    });

    return this.toDomain(characterTrait);
  }

  async update(
    id: string,
    data: Partial<Omit<CharacterTrait, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>>
  ): Promise<CharacterTrait> {
    const characterTrait = await prisma.characterTrait.update({
      where: { id },
      data: {
        ...(data.schoolYearId !== undefined && { schoolYearId: data.schoolYearId }),
        ...(data.month !== undefined && { month: data.month }),
        ...(data.characterTrait !== undefined && { characterTrait: data.characterTrait }),
        ...(data.verseText !== undefined && { verseText: data.verseText }),
        ...(data.verseReference !== undefined && { verseReference: data.verseReference }),
      },
    });

    return this.toDomain(characterTrait);
  }

  async findById(id: string): Promise<CharacterTrait | null> {
    const characterTrait = await prisma.characterTrait.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    return characterTrait ? this.toDomain(characterTrait) : null;
  }

  async findBySchoolYear(schoolYearId: string): Promise<CharacterTrait[]> {
    const characterTraits = await prisma.characterTrait.findMany({
      where: {
        schoolYearId,
        deletedAt: null,
      },
      orderBy: {
        month: 'asc',
      },
    });

    return characterTraits.map(this.toDomain);
  }

  async findBySchoolYearAndMonth(schoolYearId: string, month: number): Promise<CharacterTrait | null> {
    const characterTrait = await prisma.characterTrait.findFirst({
      where: {
        schoolYearId,
        month,
        deletedAt: null,
      },
    });

    return characterTrait ? this.toDomain(characterTrait) : null;
  }

  async delete(id: string): Promise<void> {
    await prisma.characterTrait.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private toDomain(data: any): CharacterTrait {
    return {
      id: data.id,
      schoolId: data.schoolId,
      schoolYearId: data.schoolYearId,
      month: data.month,
      characterTrait: data.characterTrait,
      verseText: data.verseText,
      verseReference: data.verseReference,
      deletedAt: data.deletedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}

