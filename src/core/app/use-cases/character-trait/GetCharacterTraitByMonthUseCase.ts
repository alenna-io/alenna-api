import { ICharacterTraitRepository } from '../../../adapters_interface/repositories/ICharacterTraitRepository';
import { CharacterTrait } from '../../../domain/entities/CharacterTrait';
import { GetCharacterTraitByMonthInput } from '../../dtos/CharacterTraitDTO';

export class GetCharacterTraitByMonthUseCase {
  constructor(private characterTraitRepository: ICharacterTraitRepository) {}

  async execute(input: GetCharacterTraitByMonthInput): Promise<CharacterTrait | null> {
    return await this.characterTraitRepository.findBySchoolYearAndMonth(
      input.schoolYearId,
      input.month
    );
  }
}

