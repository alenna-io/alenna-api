import { randomUUID } from 'crypto';
import { CreateSubSubjectInput } from '../../dtos/SubSubjectDTO';
import {
  ICategoryRepository,
  ISubSubjectRepository,
  IPaceCatalogRepository,
  ILevelRepository
} from '../../../adapters_interface/repositories';
import { SubSubject } from '../../../domain/entities';

export class CreateSubSubjectWithPacesUseCase {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly subSubjectRepository: ISubSubjectRepository,
    private readonly paceCatalogRepository: IPaceCatalogRepository,
    private readonly levelRepository: ILevelRepository,
  ) { }

  async execute(input: CreateSubSubjectInput): Promise<SubSubject> {
    // Validate that category exists
    const category = await this.categoryRepository.findById(input.categoryId);

    if (!category) {
      throw new Error('Category not found');
    }

    // Validate that level exists
    const level = await this.levelRepository.findById(input.levelId);
    if (!level) {
      throw new Error('Level not found');
    }
    // Validate pace range
    if (input.startPace > input.endPace) {
      throw new Error('Start pace must be less than or equal to end pace');
    }

    // Check if sub-subject with same name and category already exists
    const existing = await this.subSubjectRepository.findBySubjectNameAndCategoryId(input.name, input.categoryId);
    if (existing) {
      throw new Error(`Sub-subject "${input.name}" already exists in this category`);
    }

    // Create sub-subject
    const createdSubSubject = await this.subSubjectRepository.create({
      id: randomUUID(),
      name: input.name,
      categoryId: input.categoryId,
      levelId: input.levelId,
      difficulty: input.difficulty || 3,
      difficultyLabel: 'Medium',
    });

    // Generate pace codes from startPace to endPace
    const paceCodes: string[] = [];
    for (let pace = input.startPace; pace <= input.endPace; pace++) {
      paceCodes.push(String(pace));
    }

    // Create all paces
    let paceNamePrefix = category.name;
    if (paceNamePrefix === 'Electives') {
      paceNamePrefix = createdSubSubject.name;
    }
    const paceData = paceCodes.map((code) => ({
      id: randomUUID(),
      code: code,
      name: `${paceNamePrefix} ${code}`,
      subSubjectId: createdSubSubject.id,
    }));

    await this.paceCatalogRepository.createMany(paceData);

    return existing!;
  }
}
