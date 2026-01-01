import { randomUUID } from 'crypto';
import prisma from '../../../frameworks/database/prisma.client';
import { CreateSubSubjectInput } from '../../dtos/SubSubjectDTO';

export class CreateSubSubjectWithPacesUseCase {
  async execute(input: CreateSubSubjectInput): Promise<{ id: string; name: string }> {
    // Validate that category exists
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Validate that level exists
    const level = await prisma.level.findUnique({
      where: { id: input.levelId },
    });

    if (!level) {
      throw new Error('Level not found');
    }

    // Validate pace range
    if (input.startPace > input.endPace) {
      throw new Error('Start pace must be less than or equal to end pace');
    }

    // Check if sub-subject with same name and category already exists
    const existing = await prisma.subSubject.findUnique({
      where: {
        categoryId_name: {
          categoryId: input.categoryId,
          name: input.name,
        },
      },
    });

    if (existing) {
      throw new Error(`Sub-subject "${input.name}" already exists in this category`);
    }

    // Create sub-subject and paces in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create sub-subject
      const subSubject = await tx.subSubject.create({
        data: {
          id: randomUUID(),
          name: input.name,
          categoryId: input.categoryId,
          levelId: input.levelId,
          difficulty: input.difficulty || 3,
        },
      });

      // Generate pace codes from startPace to endPace
      const paceCodes: string[] = [];
      for (let pace = input.startPace; pace <= input.endPace; pace++) {
        paceCodes.push(String(pace));
      }

      // Create all paces
      const paceNamePrefix = category.name;
      const paceData = paceCodes.map((code) => ({
        id: randomUUID(),
        code: code,
        name: `${paceNamePrefix} ${code}`,
        subSubjectId: subSubject.id,
      }));

      await tx.paceCatalog.createMany({
        data: paceData,
      });

      return {
        id: subSubject.id,
        name: subSubject.name,
      };
    });

    return result;
  }
}

