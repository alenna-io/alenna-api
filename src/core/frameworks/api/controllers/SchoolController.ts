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

  async getAllSchools(req: Request, res: Response): Promise<void> {
    try {
      const schools = await container.getAllSchoolsUseCase.execute();

      res.json(schools.map(school => ({
        id: school.id,
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
      })));
    } catch (error: any) {
      console.error('Error getting all schools:', error);
      res.status(500).json({ error: error.message || 'Failed to get schools' });
    }
  }

  async getSchoolById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const school = await container.getSchoolUseCase.execute(id);

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

  async updateSchoolById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = UpdateSchoolDTO.parse(req.body);
      
      const school = await container.updateSchoolUseCase.execute(id, validatedData);

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

  async deleteSchool(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await container.deleteSchoolUseCase.execute(id);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting school:', error);
      
      if (error.message === 'School not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to delete school' });
    }
  }

  async getStudentsCount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const students = await container.getStudentsUseCase.execute(id);
      const count = students.length;

      res.json({ count });
    } catch (error: any) {
      console.error('Error getting students count:', error);
      
      if (error.message === 'School not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get students count' });
    }
  }

  async getStudents(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const students = await container.getStudentsUseCase.execute(id);

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
        isLeveled: student.isLeveled,
        expectedLevel: student.expectedLevel,
        address: student.address,
        parents: student.parents,
      })));
    } catch (error: any) {
      console.error('Error getting students:', error);
      
      if (error.message === 'School not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get students' });
    }
  }

  async getTeachersCount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const teachers = await container.getUsersUseCase.execute(id);
      const teacherCount = teachers.filter(user => 
        user.roles.some(role => role.name === 'TEACHER')
      ).length;

      res.json({ count: teacherCount });
    } catch (error: any) {
      console.error('Error getting teachers count:', error);
      
      if (error.message === 'School not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get teachers count' });
    }
  }

  async getTeachers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const users = await container.getUsersUseCase.execute(id);
      const teachers = users.filter(user => 
        user.roles.some(role => role.name === 'TEACHER')
      );

      res.json(teachers.map(teacher => ({
        id: teacher.id,
        clerkId: teacher.clerkId,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        fullName: teacher.fullName,
        schoolId: teacher.schoolId,
        roles: teacher.roles,
        primaryRole: teacher.primaryRole,
      })));
    } catch (error: any) {
      console.error('Error getting teachers:', error);
      
      if (error.message === 'School not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to get teachers' });
    }
  }
}

