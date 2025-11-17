import { Request, Response } from 'express';
import { GetReportCardUseCase } from '../../../app/use-cases/report-cards';

export class ReportCardController {
  constructor(private getReportCardUseCase: GetReportCardUseCase) {}

  getReportCard = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId, projectionId } = req.params;
      const userId = (req as any).user?.id;

      if (!studentId || !projectionId) {
        res.status(400).json({ error: 'studentId y projectionId son requeridos' });
        return;
      }

      const reportCard = await this.getReportCardUseCase.execute(
        projectionId,
        studentId,
        userId
      );

      res.json(reportCard);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('[ReportCardController] Error getting report card:', error);
      res.status(500).json({ error: errorMessage });
    }
  };
}

