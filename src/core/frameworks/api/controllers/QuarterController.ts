import { Request, Response } from 'express';
import { container } from '../../di/container';

export class QuarterController {
  async closeQuarter(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const userId = req.userId;

      const quarter = await container.closeQuarterUseCase.execute(id, schoolId, userId);

      res.json({
        id: quarter.id,
        schoolYearId: quarter.schoolYearId,
        name: quarter.name,
        displayName: quarter.displayName,
        startDate: quarter.startDate.toISOString(),
        endDate: quarter.endDate.toISOString(),
        order: quarter.order,
        weeksCount: quarter.weeksCount,
        isClosed: quarter.isClosed,
        closedAt: quarter.closedAt?.toISOString(),
        closedBy: quarter.closedBy,
        createdAt: quarter.createdAt.toISOString(),
        updatedAt: quarter.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error closing quarter:', error);
      if (error.message === 'Quarter not found' || error.message === 'Quarter does not belong to the specified school') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message === 'Quarter is already closed' || error.message === 'Grace period has ended' || error.message === 'Quarter has not ended yet') {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message || 'Failed to close quarter' });
    }
  }

  async getQuartersStatus(req: Request, res: Response): Promise<void> {
    try {
      const { schoolYearId } = req.query;
      const schoolId = req.schoolId!;

      if (!schoolYearId || typeof schoolYearId !== 'string') {
        res.status(400).json({ error: 'schoolYearId is required' });
        return;
      }

      const quarters = await container.getQuartersStatusUseCase.execute(schoolYearId, schoolId);

      res.json(quarters.map(quarter => ({
        id: quarter.id,
        schoolYearId: quarter.schoolYearId,
        name: quarter.name,
        displayName: quarter.displayName,
        startDate: quarter.startDate.toISOString(),
        endDate: quarter.endDate.toISOString(),
        order: quarter.order,
        weeksCount: quarter.weeksCount,
        isClosed: quarter.isClosed,
        closedAt: quarter.closedAt?.toISOString(),
        closedBy: quarter.closedBy,
        status: quarter.status,
        canClose: quarter.canClose,
        createdAt: quarter.createdAt.toISOString(),
        updatedAt: quarter.updatedAt.toISOString(),
      })));
    } catch (error: any) {
      console.error('Error getting quarters status:', error);
      if (error.message === 'School year not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message || 'Failed to get quarters status' });
    }
  }
}

