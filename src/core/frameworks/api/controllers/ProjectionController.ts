import { Request, Response } from 'express';
import { container } from '../../di/container';
import { CreateProjectionDTO, UpdateProjectionDTO, AddPaceToProjectionDTO, UpdatePaceGradeDTO, MovePaceDTO } from '../../../app/dtos';

export class ProjectionController {
  async getProjectionsByStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId!;
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const projections = await container.getProjectionsByStudentIdUseCase.execute(studentId);

      res.json(projections.map(projection => ({
        id: projection.id,
        studentId: projection.studentId,
        schoolYear: projection.schoolYear,
        startDate: projection.startDate.toISOString(),
        endDate: projection.endDate.toISOString(),
        isActive: projection.isActive,
        notes: projection.notes,
        createdAt: projection.createdAt?.toISOString(),
        updatedAt: projection.updatedAt?.toISOString(),
      })));
    } catch (error: any) {
      console.error('Error getting projections:', error);
      res.status(500).json({ error: error.message || 'Failed to get projections' });
    }
  }

  async getProjection(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, id } = req.params;
      const schoolId = req.schoolId!;
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const projection = await container.getProjectionByIdUseCase.execute(id, studentId);

      res.json({
        id: projection.id,
        studentId: projection.studentId,
        schoolYear: projection.schoolYear,
        startDate: projection.startDate.toISOString(),
        endDate: projection.endDate.toISOString(),
        isActive: projection.isActive,
        notes: projection.notes,
        createdAt: projection.createdAt?.toISOString(),
        updatedAt: projection.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error getting projection:', error);
      
      if (error.message === 'Projection not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get projection' });
    }
  }

  async getProjectionDetail(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, id } = req.params;
      const schoolId = req.schoolId!;
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const projectionDetail = await container.getProjectionDetailUseCase.execute(id, studentId);

      res.json(projectionDetail);
    } catch (error: any) {
      console.error('Error getting projection detail:', error);
      
      if (error.message === 'Projection not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get projection detail' });
    }
  }

  async createProjection(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = CreateProjectionDTO.parse(req.body);
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const projection = await container.createProjectionUseCase.execute(validatedData, studentId);

      res.status(201).json({
        id: projection.id,
        studentId: projection.studentId,
        schoolYear: projection.schoolYear,
        startDate: projection.startDate.toISOString(),
        endDate: projection.endDate.toISOString(),
        isActive: projection.isActive,
        notes: projection.notes,
        createdAt: projection.createdAt?.toISOString(),
        updatedAt: projection.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating projection:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to create projection' });
    }
  }

  async updateProjection(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, id } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = UpdateProjectionDTO.parse(req.body);
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const projection = await container.updateProjectionUseCase.execute(id, validatedData, studentId);

      res.json({
        id: projection.id,
        studentId: projection.studentId,
        schoolYear: projection.schoolYear,
        startDate: projection.startDate.toISOString(),
        endDate: projection.endDate.toISOString(),
        isActive: projection.isActive,
        notes: projection.notes,
        createdAt: projection.createdAt?.toISOString(),
        updatedAt: projection.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating projection:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message === 'Projection not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to update projection' });
    }
  }

  async deleteProjection(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, id } = req.params;
      const schoolId = req.schoolId!;
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      await container.deleteProjectionUseCase.execute(id, studentId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting projection:', error);
      
      if (error.message === 'Projection not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to delete projection' });
    }
  }

  async addPaceToProjection(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, id } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = AddPaceToProjectionDTO.parse(req.body);
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const projectionPace = await container.addPaceToProjectionUseCase.execute(
        id,
        studentId,
        validatedData.paceCatalogId,
        validatedData.quarter,
        validatedData.week
      );

      res.status(201).json({
        id: projectionPace.id,
        projectionId: projectionPace.projectionId,
        paceCatalogId: projectionPace.paceCatalogId,
        quarter: projectionPace.quarter,
        week: projectionPace.week,
        grade: projectionPace.grade,
        isCompleted: projectionPace.isCompleted,
        isFailed: projectionPace.isFailed,
        comments: projectionPace.comments,
        createdAt: projectionPace.createdAt?.toISOString(),
        updatedAt: projectionPace.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error al agregar PACE a la proyección:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message === 'Proyección no encontrada' || error.message === 'PACE no encontrado en el catálogo') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('already')) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to add PACE to projection' });
    }
  }

  async removePaceFromProjection(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, id, paceId } = req.params;
      const schoolId = req.schoolId!;
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      await container.removePaceFromProjectionUseCase.execute(id, paceId, studentId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error removing PACE from projection:', error);
      
      if (error.message === 'Projection not found' || error.message === 'PACE not found in projection') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to remove PACE from projection' });
    }
  }

  async updatePaceGrade(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, id, paceId } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = UpdatePaceGradeDTO.parse(req.body);
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const projectionPace = await container.updatePaceGradeUseCase.execute(
        id,
        paceId,
        studentId,
        validatedData.grade,
        validatedData.isCompleted,
        validatedData.isFailed,
        validatedData.comments,
        validatedData.note
      );

      res.json({
        id: projectionPace.id,
        projectionId: projectionPace.projectionId,
        paceCatalogId: projectionPace.paceCatalogId,
        quarter: projectionPace.quarter,
        week: projectionPace.week,
        grade: projectionPace.grade,
        isCompleted: projectionPace.isCompleted,
        isFailed: projectionPace.isFailed,
        comments: projectionPace.comments,
        createdAt: projectionPace.createdAt?.toISOString(),
        updatedAt: projectionPace.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating PACE grade:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message === 'Projection not found' || error.message === 'PACE not found in projection') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to update PACE grade' });
    }
  }

  async movePace(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, id, paceId } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = MovePaceDTO.parse(req.body);
      
      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const projectionPace = await container.movePaceUseCase.execute(
        id,
        paceId,
        studentId,
        validatedData.quarter,
        validatedData.week
      );

      res.json({
        id: projectionPace.id,
        projectionId: projectionPace.projectionId,
        paceCatalogId: projectionPace.paceCatalogId,
        quarter: projectionPace.quarter,
        week: projectionPace.week,
        grade: projectionPace.grade,
        isCompleted: projectionPace.isCompleted,
        isFailed: projectionPace.isFailed,
        comments: projectionPace.comments,
        createdAt: projectionPace.createdAt?.toISOString(),
        updatedAt: projectionPace.updatedAt?.toISOString(),
      });
    } catch (error: any) {
      console.error('Error moving PACE:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message === 'Projection not found' || error.message === 'PACE not found in projection') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to move PACE' });
    }
  }
}

