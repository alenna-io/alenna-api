import { Request, Response } from 'express';
import { container } from '../../di/container';
import { CreateMonthlyAssignmentInput, UpdateMonthlyAssignmentInput, GradeMonthlyAssignmentInput } from '../../../app/dtos';

export class MonthlyAssignmentController {
  // GET /api/v1/students/:studentId/projections/:projectionId/monthly-assignments
  async getMonthlyAssignments(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, projectionId } = req.params;
      const schoolId = req.schoolId!;
      const userId = req.userId;

      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId, userId);
      if (!student) {
        res.status(404).json({ error: 'Estudiante no encontrado' });
        return;
      }

      const assignments = await container.getMonthlyAssignmentsByProjectionUseCase.execute(
        projectionId,
        studentId
      );

      res.json(assignments);
    } catch (error: any) {
      console.error('Error getting monthly assignments:', error);
      res.status(500).json({ error: error.message || 'Error al obtener asignaciones mensuales' });
    }
  }

  // POST /api/v1/students/:studentId/projections/:projectionId/monthly-assignments
  async createMonthlyAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, projectionId } = req.params;
      const schoolId = req.schoolId!;
      const input: CreateMonthlyAssignmentInput = req.body;

      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Estudiante no encontrado' });
        return;
      }

      const assignment = await container.createMonthlyAssignmentUseCase.execute(
        projectionId,
        input,
        studentId
      );

      res.status(201).json({
        id: assignment.id,
        name: assignment.name,
        quarter: assignment.quarter,
        grade: assignment.grade,
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating monthly assignment:', error);
      res.status(500).json({ error: error.message || 'Error al crear asignación mensual' });
    }
  }

  // PUT /api/v1/students/:studentId/projections/:projectionId/monthly-assignments/:assignmentId
  async updateMonthlyAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, assignmentId } = req.params;
      const schoolId = req.schoolId!;
      const input: UpdateMonthlyAssignmentInput = req.body;

      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Estudiante no encontrado' });
        return;
      }

      const assignment = await container.updateMonthlyAssignmentUseCase.execute(
        assignmentId,
        input,
        studentId
      );

      res.json({
        id: assignment.id,
        name: assignment.name,
        quarter: assignment.quarter,
        grade: assignment.grade,
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error updating monthly assignment:', error);
      res.status(500).json({ error: error.message || 'Error al actualizar asignación mensual' });
    }
  }

  // POST /api/v1/students/:studentId/projections/:projectionId/monthly-assignments/:assignmentId/grade
  async gradeMonthlyAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, assignmentId } = req.params;
      const schoolId = req.schoolId!;
      const input: GradeMonthlyAssignmentInput = req.body;

      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Estudiante no encontrado' });
        return;
      }

      const assignment = await container.gradeMonthlyAssignmentUseCase.execute(
        assignmentId,
        input,
        studentId
      );

      res.json({
        id: assignment.id,
        name: assignment.name,
        quarter: assignment.quarter,
        grade: assignment.grade,
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error grading monthly assignment:', error);
      res.status(500).json({ error: error.message || 'Error al calificar asignación mensual' });
    }
  }

  // DELETE /api/v1/students/:studentId/projections/:projectionId/monthly-assignments/:assignmentId
  async deleteMonthlyAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, assignmentId } = req.params;
      const schoolId = req.schoolId!;

      // Verify student belongs to school
      const student = await container.getStudentByIdUseCase.execute(studentId, schoolId);
      if (!student) {
        res.status(404).json({ error: 'Estudiante no encontrado' });
        return;
      }

      await container.deleteMonthlyAssignmentUseCase.execute(assignmentId, studentId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting monthly assignment:', error);
      res.status(500).json({ error: error.message || 'Error al eliminar asignación mensual' });
    }
  }
}

