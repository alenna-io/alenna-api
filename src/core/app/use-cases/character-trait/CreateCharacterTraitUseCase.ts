import { ICharacterTraitRepository } from '../../../adapters_interface/repositories/ICharacterTraitRepository';
import { CharacterTrait } from '../../../domain/entities/CharacterTrait';
import { CreateCharacterTraitInput } from '../../dtos/CharacterTraitDTO';

export class CreateCharacterTraitUseCase {
  constructor(private characterTraitRepository: ICharacterTraitRepository) {}

  async execute(input: CreateCharacterTraitInput, schoolId: string): Promise<CharacterTrait> {
    if (input.month < 1 || input.month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    const existing = await this.characterTraitRepository.findBySchoolYearAndMonth(
      input.schoolYearId,
      input.month
    );

    if (existing) {
      throw new Error(`A character trait already exists for month ${input.month} in this school year`);
    }

    return await this.characterTraitRepository.create({
      schoolId,
      schoolYearId: input.schoolYearId,
      month: input.month,
      characterTrait: input.characterTrait,
      verseText: input.verseText,
      verseReference: input.verseReference,
      deletedAt: null,
    });
  }
}

