import { IProjectionTemplateRepository } from '../../../adapters_interface/repositories/IProjectionTemplateRepository';
import prisma from '../../../frameworks/database/prisma.client';
import { randomUUID } from 'crypto';

interface DefaultTemplateConfig {
  level: string;
  subjects: Array<{
    subjectName: string; // e.g., "Math L1", "English L1"
    startPace: number;
    endPace: number;
    skipPaces?: number[];
    notPairWith?: string[];
    extendToNext?: boolean;
  }>;
}

export class CreateDefaultTemplatesUseCase {
  constructor(private templateRepository: IProjectionTemplateRepository) {}

  async execute(schoolId: string): Promise<void> {
    // Define default templates for L1-L8
    // Pace ranges: L1 = 1001-1012, L2 = 1013-1024, L3 = 1025-1036, etc. (12 paces per level)
    const defaultTemplates: DefaultTemplateConfig[] = [];
    
    for (let levelNum = 1; levelNum <= 8; levelNum++) {
      const startPace = 1001 + (levelNum - 1) * 12; // L1: 1001, L2: 1013, L3: 1025, etc.
      const endPace = startPace + 11; // 12 paces total per level
      
      if (levelNum === 1) {
        defaultTemplates.push({
          level: 'L1',
          subjects: [
            { subjectName: 'Math L1', startPace, endPace },
            { subjectName: 'English L1', startPace, endPace },
            { subjectName: 'Science L1', startPace, endPace },
            { subjectName: 'Social Studies L1', startPace, endPace },
            { subjectName: 'Word Building L1', startPace, endPace },
            { subjectName: 'Español L1', startPace, endPace },
          ],
        });
      } else {
        // L2-L8 use "Español y Ortografía"
        defaultTemplates.push({
          level: `L${levelNum}`,
          subjects: [
            { subjectName: `Math L${levelNum}`, startPace, endPace },
            { subjectName: `English L${levelNum}`, startPace, endPace },
            { subjectName: `Science L${levelNum}`, startPace, endPace },
            { subjectName: `Social Studies L${levelNum}`, startPace, endPace },
            { subjectName: `Word Building L${levelNum}`, startPace, endPace },
            { subjectName: `Español y Ortografía L${levelNum}`, startPace, endPace },
          ],
        });
      }
    }

    // Create templates for each level
    for (const templateConfig of defaultTemplates) {
      // Check if template already exists
      const existing = await prisma.projectionTemplate.findFirst({
        where: {
          schoolId,
          level: templateConfig.level,
          isDefault: true,
          deletedAt: null,
        },
      });

      if (existing) {
        continue; // Skip if already exists
      }

      // Find sub-subjects by name
      const templateSubjects = [];
      for (const subjectConfig of templateConfig.subjects) {
        const subSubject = await prisma.subSubject.findFirst({
          where: {
            name: subjectConfig.subjectName,
          },
        });

        if (subSubject) {
          templateSubjects.push({
            subSubjectId: subSubject.id,
            subSubjectName: subSubject.name,
            startPace: subjectConfig.startPace,
            endPace: subjectConfig.endPace,
            skipPaces: subjectConfig.skipPaces || [],
            notPairWith: subjectConfig.notPairWith || [],
            extendToNext: subjectConfig.extendToNext || false,
            order: templateSubjects.length,
          });
        } else {
          console.warn(`⚠️  [CreateDefaultTemplates] Subject not found: "${subjectConfig.subjectName}" for level ${templateConfig.level}`);
        }
      }

      // Only create template if we found at least one subject
      if (templateSubjects.length > 0) {
        await this.templateRepository.create({
          name: `Plantilla ${templateConfig.level}`,
          level: templateConfig.level,
          isDefault: true,
          isActive: true,
          schoolId,
          templateSubjects,
        });
      }
    }
  }
}

