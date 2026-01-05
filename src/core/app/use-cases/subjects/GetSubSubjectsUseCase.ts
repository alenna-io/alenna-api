import { ISubSubjectRepository } from '../../../adapters_interface/repositories';
import { SubSubject } from '../../../domain/entities/SubSubject';

export class GetSubSubjectsUseCase {
  constructor(private readonly subSubjectRepository: ISubSubjectRepository) { }

  async execute(): Promise<SubSubject[]> {
    console.log('🔥 GetSubSubjectsUseCase LOADED');
    const subSubjects = await this.subSubjectRepository.findAll();
    console.log('🔥 GetSubSubjectsUseCase LOADED');
    return subSubjects;
  }
}

