import { Request, Response } from 'express';
import { container } from '../../di/container';
import { CreateSchoolDTO, UpdateSchoolDTO } from '../../../app/dtos';

export class SchoolController {
  async createSchool(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = CreateSchoolDTO.parse(req.body);
      
      const school = await container.createSchoolUseCase.execute(validatedData);

      res.status(201).json({
        id: school.id,
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
      });
    } catch (error: any) {
      console.error('Error creating school:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to create school' });
    }
  }

  async getMySchool(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      
      const school = await container.getSchoolUseCase.execute(schoolId);

      res.json({
        id: school.id,
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
      });
    } catch (error: any) {
      console.error('Error getting school:', error);
      
      if (error.message === 'School not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get school' });
    }
  }

  async updateSchool(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const validatedData = UpdateSchoolDTO.parse(req.body);
      
      const school = await container.updateSchoolUseCase.execute(schoolId, validatedData);

      res.json({
        id: school.id,
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
      });
    } catch (error: any) {
      console.error('Error updating school:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message === 'School not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to update school' });
    }
  }
}

