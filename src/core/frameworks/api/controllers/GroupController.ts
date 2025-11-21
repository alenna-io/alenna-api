import { Request, Response } from 'express';
import { container } from '../../di/container';

export class GroupController {
  async getGroupsBySchoolYear(req: Request, res: Response): Promise<void> {
    try {
      const { schoolYearId } = req.params;
      const schoolId = req.schoolId!;
      const includeDeleted = req.query.includeDeleted === 'true';

      const groups = await container.getGroupsBySchoolYearUseCase.execute({
        schoolYearId,
        schoolId,
        includeDeleted,
      });

      // Fetch students for each group
      const groupsWithStudents = await Promise.all(groups.map(async (group) => {
        const groupStudents = await container.getGroupStudentsUseCase.execute({
          groupId: group.id,
          schoolId,
          includeDeleted: false,
        });

        return {
          id: group.id,
          name: group.name,
          teacherId: group.teacherId,
          schoolYearId: group.schoolYearId,
          studentCount: groupStudents.length,
          deletedAt: group.deletedAt?.toISOString() || null,
          createdAt: group.createdAt.toISOString(),
          updatedAt: group.updatedAt.toISOString(),
        };
      }));

      res.json(groupsWithStudents);
    } catch (error: any) {
      console.error('Error getting groups by school year:', error);
      res.status(500).json({ error: error.message || 'Failed to get groups' });
    }
  }

  async getGroupById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;

      const group = await container.getGroupByIdUseCase.execute({ id, schoolId });

      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      // Fetch students for this group
      const groupStudents = await container.getGroupStudentsUseCase.execute({
        groupId: group.id,
        schoolId,
        includeDeleted: false,
      });

      res.json({
        id: group.id,
        name: group.name,
        teacherId: group.teacherId,
        schoolYearId: group.schoolYearId,
        students: groupStudents.map(gs => ({
          id: gs.id,
          groupId: gs.groupId,
          studentId: gs.studentId,
          deletedAt: gs.deletedAt?.toISOString() || null,
          createdAt: gs.createdAt.toISOString(),
          updatedAt: gs.updatedAt.toISOString(),
        })),
        deletedAt: group.deletedAt?.toISOString() || null,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error getting group by id:', error);
      
      if (error.message === 'Group not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get group' });
    }
  }

  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const { teacherId, schoolYearId, name, studentIds } = req.body;
      const schoolId = req.schoolId!;

      if (!teacherId || !schoolYearId) {
        res.status(400).json({ error: 'teacherId and schoolYearId are required' });
        return;
      }

      const { group, groupStudents } = await container.createGroupUseCase.execute({
        teacherId,
        schoolYearId,
        schoolId,
        name: name || null,
        studentIds: studentIds || [],
      });

      res.status(201).json({
        id: group.id,
        name: group.name,
        teacherId: group.teacherId,
        schoolYearId: group.schoolYearId,
        students: groupStudents.map(gs => ({
          id: gs.id,
          groupId: gs.groupId,
          studentId: gs.studentId,
        })),
        deletedAt: group.deletedAt?.toISOString() || null,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
      });
    } catch (error: any) {
      console.error('Error creating group:', error);
      
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.message.includes('already assigned')) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to create group' });
    }
  }

  async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      
      await container.deleteGroupUseCase.execute({ id, schoolId });

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      
      if (error.message === 'Group not found' || error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to delete group' });
    }
  }

  async getStudentsByTeacher(req: Request, res: Response): Promise<void> {
    try {
      const { teacherId, schoolYearId } = req.params;
      const schoolId = req.schoolId!;
      const includeDeleted = req.query.includeDeleted === 'true';

      const groups = await container.getStudentsByTeacherUseCase.execute({
        teacherId,
        schoolYearId,
        schoolId,
        includeDeleted,
      });

      // Fetch students for each group
      const groupsWithStudents = await Promise.all(groups.map(async (group) => {
        const groupStudents = await container.getGroupStudentsUseCase.execute({
          groupId: group.id,
          schoolId,
          includeDeleted: false,
        });

        return {
          id: group.id,
          name: group.name,
          teacherId: group.teacherId,
          schoolYearId: group.schoolYearId,
          studentCount: groupStudents.length,
          deletedAt: group.deletedAt?.toISOString() || null,
          createdAt: group.createdAt.toISOString(),
          updatedAt: group.updatedAt.toISOString(),
        };
      }));

      res.json(groupsWithStudents);
    } catch (error: any) {
      console.error('Error getting students by teacher:', error);
      res.status(500).json({ error: error.message || 'Failed to get students by teacher' });
    }
  }

  async addStudentsToGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { studentIds } = req.body;
      const schoolId = req.schoolId!;

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        res.status(400).json({ error: 'studentIds array is required' });
        return;
      }

      const groupStudents = await container.addStudentsToGroupUseCase.execute({
        groupId: id,
        studentIds,
        schoolId,
      });

      res.status(200).json({
        students: groupStudents.map(gs => ({
          id: gs.id,
          groupId: gs.groupId,
          studentId: gs.studentId,
        })),
      });
    } catch (error: any) {
      console.error('Error adding students to group:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.message.includes('already')) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to add students to group' });
    }
  }

  async removeStudentFromGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id, studentId } = req.params;
      const schoolId = req.schoolId!;

      await container.removeStudentFromGroupUseCase.execute({
        groupId: id,
        studentId,
        schoolId,
      });

      res.status(204).send();
    } catch (error: any) {
      console.error('Error removing student from group:', error);
      
      if (error.message.includes('not found') || error.message.includes('not in')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to remove student from group' });
    }
  }

  async getGroupStudents(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;
      const includeDeleted = req.query.includeDeleted === 'true';

      const groupStudents = await container.getGroupStudentsUseCase.execute({
        groupId: id,
        schoolId,
        includeDeleted,
      });

      res.json(groupStudents.map(gs => ({
        id: gs.id,
        groupId: gs.groupId,
        studentId: gs.studentId,
        deletedAt: gs.deletedAt?.toISOString() || null,
        createdAt: gs.createdAt.toISOString(),
        updatedAt: gs.updatedAt.toISOString(),
      })));
    } catch (error: any) {
      console.error('Error getting group students:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get group students' });
    }
  }

  async getStudentAssignments(req: Request, res: Response): Promise<void> {
    try {
      const { schoolYearId } = req.params;
      const schoolId = req.schoolId!;

      const assignments = await container.getStudentAssignmentsForSchoolYearUseCase.execute({
        schoolYearId,
        schoolId,
      });

      res.json(assignments);
    } catch (error: any) {
      console.error('Error getting student assignments:', error);
      res.status(500).json({ error: error.message || 'Failed to get student assignments' });
    }
  }
}

