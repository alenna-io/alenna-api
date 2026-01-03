import { Request, Response } from 'express';
import { container } from '../../di/container';
import { CreateRecurringExtraChargeDTO, UpdateRecurringExtraChargeDTO } from '../../../app/dtos/RecurringExtraChargeDTO';

export class RecurringExtraChargeController {
  async getByStudentId(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId!;

      const useCase = container.getRecurringExtraChargesUseCase;
      const charges = await useCase.execute(studentId, schoolId);

      res.json(charges);
    } catch (error: any) {
      console.error('Error getting recurring charges:', error);
      res.status(500).json({ error: error.message || 'Failed to get recurring charges' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId!;

      const validatedData = CreateRecurringExtraChargeDTO.parse(req.body);

      const useCase = container.createRecurringExtraChargeUseCase;
      const charge = await useCase.execute(validatedData, studentId);

      res.status(201).json(charge);
    } catch (error: any) {
      console.error('Error creating recurring charge:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: error.message || 'Failed to create recurring charge' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;

      const validatedData = UpdateRecurringExtraChargeDTO.parse(req.body);

      const useCase = container.updateRecurringExtraChargeUseCase;
      const charge = await useCase.execute(id, validatedData, schoolId);

      res.json(charge);
    } catch (error: any) {
      console.error('Error updating recurring charge:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      res.status(500).json({ error: error.message || 'Failed to update recurring charge' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;

      const useCase = container.deleteRecurringExtraChargeUseCase;
      await useCase.execute(id, schoolId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting recurring charge:', error);
      res.status(500).json({ error: error.message || 'Failed to delete recurring charge' });
    }
  }
}

