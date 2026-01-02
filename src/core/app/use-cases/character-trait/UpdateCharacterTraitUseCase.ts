import { ICharacterTraitRepository } from '../../../adapters_interface/repositories/ICharacterTraitRepository';
import { CharacterTrait } from '../../../domain/entities/CharacterTrait';
import { UpdateCharacterTraitInput } from '../../dtos/CharacterTraitDTO';

export class UpdateCharacterTraitUseCase {
  constructor(private characterTraitRepository: ICharacterTraitRepository) {}

  async execute(id: string, input: UpdateCharacterTraitInput): Promise<CharacterTrait> {
    const existing = await this.characterTraitRepository.findById(id);
    if (!existing) {
      throw new Error('Character trait not found');
    }

    if (input.month !== undefined && (input.month < 1 || input.month > 12)) {
      throw new Error('Month must be between 1 and 12');
    }

    if (input.month !== undefined || input.schoolYearId !== undefined) {
      const schoolYearId = input.schoolYearId ?? existing.schoolYearId;
      const month = input.month ?? existing.month;

      const duplicate = await this.characterTraitRepository.findBySchoolYearAndMonth(
        schoolYearId,
        month
      );

      if (duplicate && duplicate.id !== id) {
        throw new Error(`A character trait already exists for month ${month} in this school year`);
      }
    }

    return await this.characterTraitRepository.update(id, input);
  }
}

