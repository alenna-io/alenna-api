import { Router, type Router as ExpressRouter } from 'express';
import { GroupController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation, requirePermission } from '../middleware';

const router: ExpressRouter = Router();
const groupController = new GroupController();

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

// All routes
router.get('/school-year/:schoolYearId/students', requirePermission('groups.read'), groupController.getStudentAssignments.bind(groupController));
router.get('/school-year/:schoolYearId', requirePermission('groups.read'), groupController.getGroupsBySchoolYear.bind(groupController));
router.get('/:id', requirePermission('groups.read'), groupController.getGroupById.bind(groupController));
router.get('/:id/students', requirePermission('groups.read'), groupController.getGroupStudents.bind(groupController));
router.post('/', requirePermission('groups.create'), groupController.createGroup.bind(groupController));
router.post('/:id/students', requirePermission('groups.update'), groupController.addStudentsToGroup.bind(groupController));
router.delete('/:id', requirePermission('groups.delete'), groupController.deleteGroup.bind(groupController));
router.delete('/:id/students/:studentId', requirePermission('groups.update'), groupController.removeStudentFromGroup.bind(groupController));
router.get('/teacher/:teacherId/school-year/:schoolYearId', requirePermission('groups.read'), groupController.getStudentsByTeacher.bind(groupController));

export default router;

