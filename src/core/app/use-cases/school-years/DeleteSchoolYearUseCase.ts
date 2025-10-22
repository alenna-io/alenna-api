import type { ISchoolYearRepository } from '../../../adapters_interface/repositories';

export class DeleteSchoolYearUseCase {
  constructor(private schoolYearRepository: ISchoolYearRepository) {}

  async execute(id: string): Promise<void> {
    await this.schoolYearRepository.delete(id);
  }
}

