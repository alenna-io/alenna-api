import { ICharacterTraitRepository } from '../../../adapters_interface/repositories/ICharacterTraitRepository';
import { CharacterTrait } from '../../../domain/entities/CharacterTrait';
import { GetCharacterTraitsBySchoolYearInput } from '../../dtos/CharacterTraitDTO';

export class GetCharacterTraitsBySchoolYearUseCase {
  constructor(private characterTraitRepository: ICharacterTraitRepository) {}

  async execute(input: GetCharacterTraitsBySchoolYearInput): Promise<CharacterTrait[]> {
    if (!input.schoolYearId) {
      return [];
    }
    return await this.characterTraitRepository.findBySchoolYear(input.schoolYearId);
  }
}

