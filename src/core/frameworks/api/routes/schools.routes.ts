import { Router, type Router as ExpressRouter } from 'express';
import { SchoolController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, requirePermission } from '../middleware';

const router: ExpressRouter = Router();
const schoolController = new SchoolController();

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

// Get students count for a school
router.get('/:id/students/count', requirePermission('students.read'), schoolController.getStudentsCount.bind(schoolController));

// Get students for a school
router.get('/:id/students', requirePermission('students.read'), schoolController.getStudents.bind(schoolController));

// Get teachers count for a school
router.get('/:id/teachers/count', requirePermission('users.read'), schoolController.getTeachersCount.bind(schoolController));

// Get teachers for a school
router.get('/:id/teachers', requirePermission('users.read'), schoolController.getTeachers.bind(schoolController));

// Get certification types for a school
router.get('/:id/certification-types', requirePermission('students.read'), schoolController.getCertificationTypes.bind(schoolController));

export default router;

