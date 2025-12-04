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

      // Fetch user contact info for all students in one query
      const studentIds = students.map(s => s.id);
      const studentsWithUsers = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        include: { 
          user: { 
            select: { 
              email: true,
              phone: true,
              streetAddress: true,
              city: true,
              state: true,
              country: true,
              zipCode: true
            } 
          } 
        }
      });
      const userInfoMap = new Map(studentsWithUsers.map(s => [
        s.id, 
        {
          email: s.user?.email,
          phone: s.user?.phone,
          streetAddress: s.user?.streetAddress,
          city: s.user?.city,
          state: s.user?.state,
          country: s.user?.country,
          zipCode: s.user?.zipCode
        }
      ]));

      res.json(students.map(student => {
        const userInfo = userInfoMap.get(student.id) || {};
        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          name: student.fullName,
          age: student.age,
          birthDate: student.birthDate.toISOString(),
          certificationType: student.certificationType.name,
          certificationTypeId: student.certificationTypeId,
          graduationDate: student.graduationDate.toISOString(),
          email: userInfo.email,
          phone: userInfo.phone,
          isActive: student.isActive,
          isLeveled: student.isLeveled,
          expectedLevel: student.expectedLevel,
          currentLevel: student.currentLevel,
          streetAddress: userInfo.streetAddress,
          city: userInfo.city,
          state: userInfo.state,
          country: userInfo.country,
          zipCode: userInfo.zipCode,
          parents: student.parents.map(parent => ({
            id: parent.id,
            name: parent.name,
            email: parent.email,
            firstName: parent.firstName,
            lastName: parent.lastName,
            phone: parent.phone,
            relationship: parent.relationship,
          })),
        };
      }));
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

      // Get student's user contact info (need to fetch user separately)
      const studentWithUser = await prisma.student.findUnique({
        where: { id: student.id },
        include: { 
          user: { 
            select: { 
              email: true, 
              id: true,
              phone: true,
              streetAddress: true,
              city: true,
              state: true,
              country: true,
              zipCode: true
            } 
          } 
        }
      });

      res.json({
        id: student.id,
        userId: studentWithUser?.user?.id || undefined,
        firstName: student.firstName,
        lastName: student.lastName,
        name: student.fullName,
        age: student.age,
        birthDate: student.birthDate.toISOString(),
        certificationType: student.certificationType.name,
        certificationTypeId: student.certificationTypeId,
        graduationDate: student.graduationDate.toISOString(),
        email: studentWithUser?.user?.email || undefined,
        phone: studentWithUser?.user?.phone || undefined,
        isActive: student.isActive,
        isLeveled: student.isLeveled,
        expectedLevel: student.expectedLevel,
        currentLevel: student.currentLevel,
        streetAddress: studentWithUser?.user?.streetAddress || undefined,
        city: studentWithUser?.user?.city || undefined,
        state: studentWithUser?.user?.state || undefined,
        country: studentWithUser?.user?.country || undefined,
        zipCode: studentWithUser?.user?.zipCode || undefined,
        parents: student.parents.map(parent => ({
          id: parent.id,
          name: parent.name,
          email: parent.email,
          firstName: parent.firstName,
          lastName: parent.lastName,
          phone: parent.phone,
          relationship: parent.relationship,
        })),
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
      const currentUserRoles = req.userRoles || [];
      
      await container.deleteStudentUseCase.execute(id, schoolId, currentUserRoles);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      
      if (error.message === 'Student not found' || error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('Failed to delete user from Clerk')) {
        res.status(500).json({ error: error.message });
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

  /**
   * Reactivate a student by student ID.
   * This delegates to the existing ReactivateUserUseCase using the student's userId,
   * which will also reactivate linked parents if they were deactivated due to this student.
   */
  async reactivateStudent(req: Request, res: Response): Promise<void> {
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

      // Delegate to user reactivation use case (handles students/parents logic)
      await container.reactivateUserUseCase.execute(
        student.userId,
        currentUserId,
        schoolId,
        currentUserRoles,
      );

      res.status(204).send();
    } catch (error: any) {
      console.error('Error reactivating student:', error);

      const message = error.message || 'Failed to reactivate student';

      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }

      if (
        message.includes('Cannot reactivate') ||
        message.includes('permission') ||
        message.includes('already active') ||
        message.includes('does not belong')
      ) {
        res.status(400).json({ error: message });
        return;
      }

      res.status(500).json({ error: message });
    }
  }
}

