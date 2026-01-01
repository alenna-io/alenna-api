import { ITuitionTypeRepository } from '../../../adapters_interface/repositories';

export class DeleteTuitionTypeUseCase {
  constructor(private tuitionTypeRepository: ITuitionTypeRepository) {}

  async execute(id: string, schoolId: string): Promise<void> {
    const existing = await this.tuitionTypeRepository.findById(id, schoolId);
    if (!existing) {
      throw new Error('Tuition type not found');
    }

    await this.tuitionTypeRepository.delete(id, schoolId);
  }
}

