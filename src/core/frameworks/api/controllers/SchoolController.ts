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
        isActive: school.isActive,
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
        isActive: school.isActive,
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

  async getAllSchools(_req: Request, res: Response): Promise<void> {
    try {
      const schools = await container.getAllSchoolsUseCase.execute();

      res.json(schools.map(school => ({
        id: school.id,
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
        isActive: school.isActive,
      })));
    } catch (error: any) {
      console.error('Error getting all schools:', error);
      res.status(500).json({ error: error.message || 'Failed to get schools' });
    }
  }

  async getSchoolById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId;
      const userRoles = req.userRoles || [];
      
      // School admins can only access their own school
      const isSuperAdmin = userRoles.includes('SUPERADMIN');
      if (!isSuperAdmin && schoolId && id !== schoolId) {
        res.status(403).json({ error: 'No tienes permiso para acceder a esta escuela' });
        return;
      }
      
      const school = await container.getSchoolUseCase.execute(id);

      res.json({
        id: school.id,
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
        isActive: school.isActive,
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
        isActive: school.isActive,
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
      const userId = req.userId;
      
      const students = await container.getStudentsUseCase.execute(id, userId);
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
      const userId = req.userId;
      
      const students = await container.getStudentsUseCase.execute(id, userId);

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

  async getMyTeachers(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      
      const users = await container.getUsersUseCase.execute(schoolId);
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
      res.status(500).json({ error: error.message || 'Failed to get teachers' });
    }
  }

  async getMyTeachersCount(req: Request, res: Response): Promise<void> {
    try {
      const schoolId = req.schoolId!;
      
      const users = await container.getUsersUseCase.execute(schoolId);
      const teachersCount = users.filter(user => 
        user.roles.some(role => role.name === 'TEACHER')
      ).length;

      res.json({ count: teachersCount });
    } catch (error: any) {
      console.error('Error getting teachers count:', error);
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

  async getCertificationTypes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!; // Use authenticated user's school
      
      // Verify the requested school matches the user's school (unless superadmin)
      const requestedSchoolId = id === 'me' ? schoolId : id;
      const userRoles = req.userRoles || [];
      const isSuperAdmin = userRoles.includes('SUPERADMIN');
      
      if (!isSuperAdmin && requestedSchoolId !== schoolId) {
        res.status(403).json({ error: 'No tienes permiso para acceder a esta información' });
        return;
      }
      
      const { GetCertificationTypesUseCase } = await import('../../../app/use-cases/certification-types/GetCertificationTypesUseCase');
      const getCertificationTypesUseCase = new GetCertificationTypesUseCase();
      const certificationTypes = await getCertificationTypesUseCase.execute(requestedSchoolId);

      res.json(certificationTypes.map(ct => ({
        id: ct.id,
        name: ct.name,
        description: ct.description,
        isActive: ct.isActive,
      })));
    } catch (error: any) {
      console.error('Error getting certification types:', error);
      res.status(500).json({ error: error.message || 'Failed to get certification types' });
    }
  }

  async createCertificationType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId!;

      const requestedSchoolId = id === 'me' ? schoolId : id;
      const userRoles = req.userRoles || [];
      const isSuperAdmin = userRoles.includes('SUPERADMIN');

      if (!isSuperAdmin && requestedSchoolId !== schoolId) {
        res.status(403).json({ error: 'No tienes permiso para modificar esta información' });
        return;
      }

      const { CreateCertificationTypeDTO } = await import('../../../app/dtos');
      const validatedData = CreateCertificationTypeDTO.parse(req.body);

      const { CreateCertificationTypeUseCase } = await import('../../../app/use-cases/certification-types/CreateCertificationTypeUseCase');
      const createCertificationTypeUseCase = new CreateCertificationTypeUseCase();
      const certificationType = await createCertificationTypeUseCase.execute(requestedSchoolId, validatedData);

      res.status(201).json({
        id: certificationType.id,
        name: certificationType.name,
        description: certificationType.description,
        isActive: certificationType.isActive,
      });
    } catch (error: any) {
      console.error('Error creating certification type:', error);

      if (error.name === 'ZodError') {
        res.status(400).json({ error: error.errors });
        return;
      }

      if (error.code === 'P2002') {
        res.status(400).json({ error: 'Ya existe un tipo de certificación con este nombre para la escuela' });
        return;
      }

      res.status(500).json({ error: error.message || 'Failed to create certification type' });
    }
  }

  async activateSchool(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await container.activateSchoolUseCase.execute(id);

      res.json({ message: 'School activated successfully' });
    } catch (error: any) {
      console.error('Error activating school:', error);
      
      if (error.message === 'School not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.message === 'School is already active') {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to activate school' });
    }
  }

  async deactivateSchool(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await container.deactivateSchoolUseCase.execute(id);

      res.json({ message: 'School deactivated successfully' });
    } catch (error: any) {
      console.error('Error deactivating school:', error);
      
      if (error.message === 'School not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.message === 'School is already inactive') {
        res.status(400).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to deactivate school' });
    }
  }

  async getAllModules(_req: Request, res: Response): Promise<void> {
    try {
      const modules = await container.getAllModulesUseCase.execute();
      res.json(modules);
    } catch (error: any) {
      console.error('Error getting all modules:', error);
      res.status(500).json({ error: error.message || 'Failed to get modules' });
    }
  }

  async getSchoolModules(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const modules = await container.getSchoolModulesUseCase.execute(id);
      res.json(modules);
    } catch (error: any) {
      console.error('Error getting school modules:', error);
      res.status(500).json({ error: error.message || 'Failed to get school modules' });
    }
  }

  async enableSchoolModule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { moduleId } = req.body;

      if (!moduleId) {
        res.status(400).json({ error: 'moduleId is required' });
        return;
      }

      await container.enableSchoolModuleUseCase.execute(id, moduleId);
      res.json({ message: 'Module enabled successfully' });
    } catch (error: any) {
      console.error('Error enabling school module:', error);
      
      if (error.message === 'Module not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ error: error.message || 'Failed to enable module' });
    }
  }

  async disableSchoolModule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { moduleId } = req.body;

      if (!moduleId) {
        res.status(400).json({ error: 'moduleId is required' });
        return;
      }

      await container.disableSchoolModuleUseCase.execute(id, moduleId);
      res.json({ message: 'Module disabled successfully' });
    } catch (error: any) {
      console.error('Error disabling school module:', error);
      res.status(500).json({ error: error.message || 'Failed to disable module' });
    }
  }
}

