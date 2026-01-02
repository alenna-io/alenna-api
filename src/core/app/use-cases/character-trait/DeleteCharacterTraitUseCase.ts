import { ICharacterTraitRepository } from '../../../adapters_interface/repositories/ICharacterTraitRepository';

export class DeleteCharacterTraitUseCase {
  constructor(private characterTraitRepository: ICharacterTraitRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.characterTraitRepository.findById(id);
    if (!existing) {
      throw new Error('Character trait not found');
    }
    await this.characterTraitRepository.delete(id);
  }
}

