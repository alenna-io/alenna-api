import type { Request, Response } from 'express';
import type {
  CreateSchoolYearUseCase,
  GetSchoolYearsUseCase,
  GetSchoolYearByIdUseCase,
  UpdateSchoolYearUseCase,
  DeleteSchoolYearUseCase,
  SetActiveSchoolYearUseCase,
  GetCurrentWeekUseCase,
  PreviewQuarterWeeksUseCase,
} from '../../../app/use-cases';
import { CreateSchoolYearInputSchema, UpdateSchoolYearInputSchema, PreviewQuarterWeeksInputSchema } from '../../../app/dtos';

export class SchoolYearController {
  constructor(
    private createSchoolYearUseCase: CreateSchoolYearUseCase,
    private getSchoolYearsUseCase: GetSchoolYearsUseCase,
    private getSchoolYearByIdUseCase: GetSchoolYearByIdUseCase,
    private updateSchoolYearUseCase: UpdateSchoolYearUseCase,
    private deleteSchoolYearUseCase: DeleteSchoolYearUseCase,
    private setActiveSchoolYearUseCase: SetActiveSchoolYearUseCase,
    private getCurrentWeekUseCase: GetCurrentWeekUseCase,
    private previewQuarterWeeksUseCase: PreviewQuarterWeeksUseCase
  ) {}

  createSchoolYear = async (req: Request, res: Response) => {
    try {
      const schoolId = (req as any).schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: 'School ID no encontrado' });
      }
      const validatedData = CreateSchoolYearInputSchema.parse(req.body);
      
      const schoolYear = await this.createSchoolYearUseCase.execute(validatedData, schoolId);
      
      return res.status(201).json(schoolYear);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      return res.status(400).json({ error: error.message || 'Error al crear año escolar' });
    }
  };

  getSchoolYears = async (req: Request, res: Response) => {
    try {
      const schoolId = (req as any).schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: 'School ID no encontrado' });
      }
      const schoolYears = await this.getSchoolYearsUseCase.execute(schoolId);
      return res.json(schoolYears);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Error al obtener años escolares' });
    }
  };

  getSchoolYearById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const schoolYear = await this.getSchoolYearByIdUseCase.execute(id);
      return res.json(schoolYear);
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message || 'Error al obtener año escolar' });
    }
  };

  updateSchoolYear = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = UpdateSchoolYearInputSchema.parse(req.body);
      
      const schoolYear = await this.updateSchoolYearUseCase.execute(id, validatedData);
      
      return res.json(schoolYear);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      return res.status(400).json({ error: error.message || 'Error al actualizar año escolar' });
    }
  };

  deleteSchoolYear = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.deleteSchoolYearUseCase.execute(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Error al eliminar año escolar' });
    }
  };

  setActiveSchoolYear = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const schoolId = (req as any).schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: 'School ID no encontrado' });
      }
      
      const schoolYear = await this.setActiveSchoolYearUseCase.execute(id, schoolId);
      
      return res.json(schoolYear);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Error al activar año escolar' });
    }
  };

  getCurrentWeek = async (req: Request, res: Response) => {
    try {
      const schoolId = (req as any).schoolId;
      const userRoles = (req as any).userRoles || [];
      const isSuperAdmin = userRoles.includes('SUPERADMIN');
      
      // Super admins don't have a school context, return 404 gracefully
      if (!schoolId && isSuperAdmin) {
        return res.status(404).json({ error: 'No hay un año escolar activo' });
      }
      
      if (!schoolId) {
        return res.status(400).json({ error: 'School ID no encontrado' });
      }
      
      const currentWeek = await this.getCurrentWeekUseCase.execute(schoolId);
      
      if (!currentWeek) {
        return res.status(404).json({ error: 'No hay un año escolar activo' });
      }
      
      return res.json(currentWeek);
    } catch (error: any) {
      console.error('Error in getCurrentWeek:', error);
      return res.status(400).json({ error: error.message || 'Error al obtener semana actual' });
    }
  };

  previewQuarterWeeks = async (req: Request, res: Response) => {
    try {
      const validatedData = PreviewQuarterWeeksInputSchema.parse(req.body);
      const weeks = await this.previewQuarterWeeksUseCase.execute(validatedData);
      return res.json(weeks);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      return res.status(400).json({ error: error.message || 'Error al previsualizar semanas' });
    }
  };
}

