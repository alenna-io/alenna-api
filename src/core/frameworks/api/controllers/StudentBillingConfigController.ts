import { Request, Response } from 'express';
import { container } from '../../di/container';
import { UpdateStudentBillingConfigDTO } from '../../../app/dtos/StudentBillingConfigDTO';

export class StudentBillingConfigController {
  async getByStudentId(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      const useCase = container.getBillingConfigByStudentUseCase;
      const config = await useCase.execute(studentId);

      res.json(config);
    } catch (error: any) {
      console.error('Error getting student billing config:', error);
      res.status(500).json({ error: error.message || 'Failed to get student billing config' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { studentId, requiresTaxableInvoice } = req.body;

      console.log("Updating student billing config", studentId, requiresTaxableInvoice);

      const validatedData = UpdateStudentBillingConfigDTO.parse(req.body);

      const useCase = container.updateBillingConfigByStudentUseCase;
      const config = await useCase.execute(studentId, validatedData);

      return res.status(200).json(config);
    } catch (error: any) {
      console.error('Error updating student billing config:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      return res.status(500).json({ error: error.message || 'Failed to update student billing config' });
    }
  }
}

