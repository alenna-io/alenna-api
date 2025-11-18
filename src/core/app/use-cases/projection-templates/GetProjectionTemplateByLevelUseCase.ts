import { IProjectionTemplateRepository } from '../../../adapters_interface/repositories/IProjectionTemplateRepository';

export class GetProjectionTemplateByLevelUseCase {
  constructor(private templateRepository: IProjectionTemplateRepository) {}

  async execute(schoolId: string, level: string): Promise<any | null> {
    // Try to find default template first
    const defaultTemplate = await this.templateRepository.findDefaultByLevel(schoolId, level);
    if (defaultTemplate) {
      return {
        id: defaultTemplate.id,
        name: defaultTemplate.name,
        level: defaultTemplate.level,
        isDefault: defaultTemplate.isDefault,
        isActive: defaultTemplate.isActive,
        subjects: defaultTemplate.templateSubjects.map(subject => ({
          subSubjectId: subject.subSubjectId,
          subSubjectName: subject.subSubjectName,
          startPace: subject.startPace,
          endPace: subject.endPace,
          skipPaces: subject.skipPaces,
          notPairWith: subject.notPairWith,
          extendToNext: subject.extendToNext,
        })),
      };
    }

    // If no default, return first active template
    const templates = await this.templateRepository.findByLevel(schoolId, level);
    const activeTemplate = templates.find(t => t.isActive);
    
    if (!activeTemplate) return null;

    return {
      id: activeTemplate.id,
      name: activeTemplate.name,
      level: activeTemplate.level,
      isDefault: activeTemplate.isDefault,
      isActive: activeTemplate.isActive,
      subjects: activeTemplate.templateSubjects.map(subject => ({
        subSubjectId: subject.subSubjectId,
        subSubjectName: subject.subSubjectName,
        startPace: subject.startPace,
        endPace: subject.endPace,
        skipPaces: subject.skipPaces,
        notPairWith: subject.notPairWith,
        extendToNext: subject.extendToNext,
      })),
    };
  }
}

