import { Request, Response } from 'express';
import { container } from '../../di/container';
import { CreateStudentDTO, UpdateStudentDTO } from '../../../app/dtos';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StudentController {
  async getStudents(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const userId = req.userId; // For parent filtering
      
      const students = await container.getStudentsUseCase.execute(schoolId, userId);

      res.json(students.map(student => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        name: student.fullName,
        age: student.age,
        birthDate: student.birthDate.toISOString(),
        certificationType: student.certificationType.name,
        certificationTypeId: student.certificationTypeId,
        graduationDate: student.graduationDate.toISOString(),
        contactPhone: student.contactPhone,
        isActive: student.isActive,
        isLeveled: student.isLeveled,
        expectedLevel: student.expectedLevel,
        currentLevel: student.currentLevel,
        address: student.address,
        parents: student.parents,
      })));
    } catch (error: any) {
      console.error('Error getting students:', error);
      res.status(500).json({ error: error.message || 'Failed to get students' });
    }
  }

  async getStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const userId = req.userId; // For parent access check

      const student = await container.getStudentByIdUseCase.execute(id, schoolId, userId);

      res.json({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        name: student.fullName,
        age: student.age,
        birthDate: student.birthDate.toISOString(),
        certificationType: student.certificationType.name,
        certificationTypeId: student.certificationTypeId,
        graduationDate: student.graduationDate.toISOString(),
        contactPhone: student.contactPhone,
        isActive: student.isActive,
        isLeveled: student.isLeveled,
        expectedLevel: student.expectedLevel,
        currentLevel: student.currentLevel,
        address: student.address,
        parents: student.parents,
      });
    } catch (error: any) {
      console.error('Error getting student:', error);
      
      if (error.message === 'Student not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get student' });
    }
  }

  async createStudent(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      const validatedData = CreateStudentDTO.parse(req.body);
      
      const student = await container.createStudentUseCase.execute(validatedData, schoolId);

      res.status(201).json({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        name: student.fullName,
        age: student.age,
        birthDate: student.birthDate.toISOString(),
        certificationType: student.certificationType.name,
        certificationTypeId: student.certificationTypeId,
        graduationDate: student.graduationDate.toISOString(),
        contactPhone: student.contactPhone,
        isLeveled: student.isLeveled,
        expectedLevel: student.expectedLevel,
        address: student.address,
        parents: student.parents,
      });
    } catch (error: any) {
      console.error('Error creating student:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to create student' });
    }
  }

  async updateStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const validatedData = UpdateStudentDTO.parse(req.body);
      
      const student = await container.updateStudentUseCase.execute(id, validatedData, schoolId);

      res.json({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        name: student.fullName,
        age: student.age,
        birthDate: student.birthDate.toISOString(),
        certificationType: student.certificationType.name,
        certificationTypeId: student.certificationTypeId,
        graduationDate: student.graduationDate.toISOString(),
        contactPhone: student.contactPhone,
        isLeveled: student.isLeveled,
        expectedLevel: student.expectedLevel,
        currentLevel: student.currentLevel,
        address: student.address,
        parents: student.parents,
      });
    } catch (error: any) {
      console.error('Error updating student:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }
      
      if (error.message === 'Student not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to update student' });
    }
  }

  async deleteStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      
      await container.deleteStudentUseCase.execute(id, schoolId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      
      if (error.message === 'Student not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to delete student' });
    }
  }

  /**
   * Deactivate a student by student ID.
   * This delegates to the existing DeactivateUserUseCase using the student's userId,
   * which will also deactivate linked parents if they have no other active students.
   */
  async deactivateStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const currentUserId = req.userId!;
      const currentUserRoles = req.userRoles || [];

      // Ensure student exists in current school and get linked userId
      const student = await prisma.student.findFirst({
        where: {
          id,
          schoolId,
          deletedAt: null,
        },
        select: {
          userId: true,
        },
      });

      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      // Delegate to user deactivation use case (handles students/parents logic)
      await container.deactivateUserUseCase.execute(
        student.userId,
        currentUserId,
        schoolId,
        currentUserRoles,
      );

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deactivating student:', error);

      const message = error.message || 'Failed to deactivate student';

      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }

      if (
        message.includes('Cannot deactivate') ||
        message.includes('permission') ||
        message.includes('already inactive') ||
        message.includes('Cannot deactivate parent directly')
      ) {
        res.status(400).json({ error: message });
        return;
      }

      if (message.includes('does not belong')) {
        res.status(403).json({ error: message });
        return;
      }

      res.status(500).json({ error: message });
    }
  }
}

