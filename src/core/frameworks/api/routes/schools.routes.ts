import { Router, type Router as ExpressRouter } from 'express';
import { SchoolController } from '../controllers';
import { CharacterTraitController } from '../controllers/CharacterTraitController';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, requirePermission, cacheMiddleware } from '../middleware';

const router: ExpressRouter = Router();
const schoolController = new SchoolController();
const characterTraitController = new CharacterTraitController();

// Apply Clerk middleware
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));

// Create school (public - for onboarding new schools)
router.post('/', schoolController.createSchool.bind(schoolController));

// Protected routes
router.use(requireAuth());
router.use(attachUserContext);

// Get current user's school
router.get('/me', requirePermission('schoolInfo.read'), schoolController.getMySchool.bind(schoolController));

// Update current user's school (Admin only)
router.put('/me', requirePermission('schoolInfo.update'), schoolController.updateSchool.bind(schoolController));

// Character Trait routes
router.post('/me/character-traits', requirePermission('schoolInfo.update'), characterTraitController.create.bind(characterTraitController));
router.get('/me/character-traits/by-month', requirePermission('schoolInfo.read'), characterTraitController.getByMonth.bind(characterTraitController));
router.get('/me/character-traits/:id', requirePermission('schoolInfo.read'), characterTraitController.getById.bind(characterTraitController));
router.get('/me/character-traits', requirePermission('schoolInfo.read'), characterTraitController.getAll.bind(characterTraitController));
router.put('/me/character-traits/:id', requirePermission('schoolInfo.update'), characterTraitController.update.bind(characterTraitController));
router.delete('/me/character-traits/:id', requirePermission('schoolInfo.update'), characterTraitController.delete.bind(characterTraitController));

// Get teachers for current user's school
router.get('/me/teachers', cacheMiddleware({ maxAge: 1800, staleWhileRevalidate: 3600 }), requirePermission('teachers.read'), schoolController.getMyTeachers.bind(schoolController));

// Get teachers count for current user's school
router.get('/me/teachers/count', cacheMiddleware({ maxAge: 1800, staleWhileRevalidate: 3600 }), requirePermission('teachers.read'), schoolController.getMyTeachersCount.bind(schoolController));

// Superadmin-only routes for managing all schools
// Get all schools
router.get('/', requirePermission('schools.read'), schoolController.getAllSchools.bind(schoolController));

// Get specific school by ID
router.get('/:id', requirePermission('schools.read'), schoolController.getSchoolById.bind(schoolController));

// Create new school (also available via public route above, but protected here for superadmins)
router.post('/admin/create', requirePermission('schools.create'), schoolController.createSchool.bind(schoolController));

// Update specific school by ID
router.put('/:id', requirePermission('schools.update'), schoolController.updateSchoolById.bind(schoolController));

// Delete school
router.delete('/:id', requirePermission('schools.delete'), schoolController.deleteSchool.bind(schoolController));

// Activate school
router.post('/:id/activate', requirePermission('schools.update'), schoolController.activateSchool.bind(schoolController));

// Deactivate school
router.post('/:id/deactivate', requirePermission('schools.update'), schoolController.deactivateSchool.bind(schoolController));

// Get students count for a school
router.get('/:id/students/count', requirePermission('students.read'), schoolController.getStudentsCount.bind(schoolController));

// Get students for a school
router.get('/:id/students', requirePermission('students.read'), schoolController.getStudents.bind(schoolController));

// Get teachers count for a school
router.get('/:id/teachers/count', cacheMiddleware({ maxAge: 1800, staleWhileRevalidate: 3600 }), requirePermission('teachers.read'), schoolController.getTeachersCount.bind(schoolController));

// Get teachers for a school
router.get('/:id/teachers', cacheMiddleware({ maxAge: 1800, staleWhileRevalidate: 3600 }), requirePermission('teachers.read'), schoolController.getTeachers.bind(schoolController));

// Get parents for a school
router.get('/:id/parents', requirePermission('students.read'), schoolController.getParents.bind(schoolController));

// Get certification types for a school
router.get('/:id/certification-types', requirePermission('students.read'), schoolController.getCertificationTypes.bind(schoolController));

// Create certification type for a school
router.post('/:id/certification-types', requirePermission('schoolInfo.update'), schoolController.createCertificationType.bind(schoolController));

// Module management routes (Super Admin only)
// Get all available modules
router.get('/modules/all', requirePermission('schools.read'), schoolController.getAllModules.bind(schoolController));

// Get modules for a specific school
router.get('/:id/modules', requirePermission('schools.read'), schoolController.getSchoolModules.bind(schoolController));

// Enable a module for a school
router.post('/:id/modules/enable', requirePermission('schools.update'), schoolController.enableSchoolModule.bind(schoolController));

// Disable a module for a school
router.post('/:id/modules/disable', requirePermission('schools.update'), schoolController.disableSchoolModule.bind(schoolController));

export default router;

