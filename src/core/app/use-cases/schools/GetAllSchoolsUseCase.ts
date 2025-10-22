import { ISchoolRepository } from '../../../adapters_interface/repositories';
import { School } from '../../../domain/entities';

export class GetAllSchoolsUseCase {
  constructor(private schoolRepository: ISchoolRepository) {}

  async execute(): Promise<School[]> {
    return this.schoolRepository.findAll();
  }
}
