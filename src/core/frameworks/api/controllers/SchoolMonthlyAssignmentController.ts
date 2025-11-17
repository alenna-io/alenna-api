import { Request, Response } from 'express';
import {
  CreateSchoolMonthlyAssignmentTemplateUseCase,
  GetSchoolMonthlyAssignmentTemplatesUseCase,
  DeleteSchoolMonthlyAssignmentTemplateUseCase,
  UpdateSchoolMonthlyAssignmentTemplateUseCase,
  UpdateQuarterGradePercentageUseCase,
  GetQuarterGradePercentagesUseCase,
} from '../../app/use-cases/school-monthly-assignments';

export class SchoolMonthlyAssignmentController {
  constructor(
    private createTemplateUseCase: CreateSchoolMonthlyAssignmentTemplateUseCase,
    private getTemplatesUseCase: GetSchoolMonthlyAssignmentTemplatesUseCase,
    private deleteTemplateUseCase: DeleteSchoolMonthlyAssignmentTemplateUseCase,
    private updateTemplateUseCase: UpdateSchoolMonthlyAssignmentTemplateUseCase,
    private updatePercentageUseCase: UpdateQuarterGradePercentageUseCase,
    private getPercentagesUseCase: GetQuarterGradePercentagesUseCase,
  ) {}

  createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { name, quarter, schoolYearId } = req.body;

      if (!name || !quarter || !schoolYearId) {
        res.status(400).json({ error: 'Nombre, trimestre y año escolar son requeridos' });
        return;
      }

      const result = await this.createTemplateUseCase.execute(
        { name, quarter, schoolYearId },
        userId
      );

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating school monthly assignment template:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error al crear plantilla de asignación',
      });
    }
  };

  getTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { schoolYearId } = req.params;

      if (!schoolYearId) {
        res.status(400).json({ error: 'ID de año escolar es requerido' });
        return;
      }

      const templates = await this.getTemplatesUseCase.execute(schoolYearId, userId);
      res.status(200).json(templates);
    } catch (error) {
      console.error('Error getting school monthly assignment templates:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error al obtener plantillas',
      });
    }
  };

  updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { templateId } = req.params;
      const { name } = req.body;

      if (!templateId) {
        res.status(400).json({ error: 'ID de plantilla es requerido' });
        return;
      }

      if (!name) {
        res.status(400).json({ error: 'Nombre es requerido' });
        return;
      }

      const result = await this.updateTemplateUseCase.execute(templateId, { name }, userId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating school monthly assignment template:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error al actualizar plantilla',
      });
    }
  };

  deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { templateId } = req.params;

      if (!templateId) {
        res.status(400).json({ error: 'ID de plantilla es requerido' });
        return;
      }

      await this.deleteTemplateUseCase.execute(templateId, userId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting school monthly assignment template:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error al eliminar plantilla',
      });
    }
  };

  updateGradePercentage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { schoolYearId, quarter, percentage } = req.body;

      if (!schoolYearId || !quarter || percentage === undefined) {
        res.status(400).json({ error: 'Año escolar, trimestre y porcentaje son requeridos' });
        return;
      }

      const result = await this.updatePercentageUseCase.execute(
        { schoolYearId, quarter, percentage },
        userId
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating quarter grade percentage:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error al actualizar porcentaje',
      });
    }
  };

  getGradePercentages = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { schoolYearId } = req.params;

      if (!schoolYearId) {
        res.status(400).json({ error: 'ID de año escolar es requerido' });
        return;
      }

      const percentages = await this.getPercentagesUseCase.execute(schoolYearId, userId);
      res.status(200).json(percentages);
    } catch (error) {
      console.error('Error getting quarter grade percentages:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error al obtener porcentajes',
      });
    }
  };
}

