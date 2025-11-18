import { Request, Response } from 'express';
import { container } from '../../di/container';

export class ProjectionTemplateController {
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const level = req.query.level as string | undefined;

      const templates = await container.getProjectionTemplatesUseCase.execute(schoolId, level);
      res.json(templates);
    } catch (error: any) {
      console.error('Error getting projection templates:', error);
      res.status(500).json({ error: error.message || 'Failed to get projection templates' });
    }
  }

  async getTemplateByLevel(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const level = req.params.level as string;

      const template = await container.getProjectionTemplateByLevelUseCase.execute(schoolId, level);
      if (!template) {
        res.status(404).json({ error: 'Template not found for this level' });
        return;
      }
      res.json(template);
    } catch (error: any) {
      console.error('Error getting projection template by level:', error);
      res.status(500).json({ error: error.message || 'Failed to get projection template' });
    }
  }

  async getTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const id = req.params.id as string;

      const template = await container.projectionTemplateRepository.findById(id, schoolId);
      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }
      res.json({
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
      });
    } catch (error: any) {
      console.error('Error getting projection template by id:', error);
      res.status(500).json({ error: error.message || 'Failed to get projection template' });
    }
  }
}

