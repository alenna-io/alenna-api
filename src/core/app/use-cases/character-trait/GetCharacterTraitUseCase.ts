import { ICharacterTraitRepository } from '../../../adapters_interface/repositories/ICharacterTraitRepository';
import { CharacterTrait } from '../../../domain/entities/CharacterTrait';

export class GetCharacterTraitUseCase {
  constructor(private characterTraitRepository: ICharacterTraitRepository) {}

  async execute(id: string): Promise<CharacterTrait> {
    const characterTrait = await this.characterTraitRepository.findById(id);
    if (!characterTrait) {
      throw new Error('Character trait not found');
    }
    return characterTrait;
  }
}

