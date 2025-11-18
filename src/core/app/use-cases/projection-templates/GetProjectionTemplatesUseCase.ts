import { IProjectionTemplateRepository } from '../../../adapters_interface/repositories/IProjectionTemplateRepository';

export class GetProjectionTemplatesUseCase {
  constructor(private templateRepository: IProjectionTemplateRepository) {}

  async execute(schoolId: string, level?: string): Promise<any[]> {
    const templates = level
      ? await this.templateRepository.findByLevel(schoolId, level)
      : await this.templateRepository.findBySchoolId(schoolId);

    return templates.map(template => ({
      id: template.id,
      name: template.name,
      level: template.level,
      isDefault: template.isDefault,
      isActive: template.isActive,
      subjects: template.templateSubjects.map(subject => ({
        subSubjectId: subject.subSubjectId,
        subSubjectName: subject.subSubjectName,
        startPace: subject.startPace,
        endPace: subject.endPace,
        skipPaces: subject.skipPaces,
        notPairWith: subject.notPairWith,
        extendToNext: subject.extendToNext,
      })),
    }));
  }
}

