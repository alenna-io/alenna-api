import { Router, type Router as ExpressRouter } from 'express';
import { StudentController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation, requirePermission, requireAnyPermission, cacheMiddleware } from '../middleware';

const router: ExpressRouter = Router();
const studentController = new StudentController();

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

// All routes
router.get('/', cacheMiddleware({ maxAge: 300, staleWhileRevalidate: 600 }), requireAnyPermission('students.read', 'students.readOwn'), studentController.getStudents.bind(studentController));
router.get('/:id', cacheMiddleware({ maxAge: 120, staleWhileRevalidate: 240 }), requireAnyPermission('students.read', 'students.readOwn'), studentController.getStudent.bind(studentController));
router.post('/', requirePermission('students.create'), studentController.createStudent.bind(studentController));
router.put('/:id', requirePermission('students.update'), studentController.updateStudent.bind(studentController));
router.post('/:id/deactivate', requirePermission('students.delete'), studentController.deactivateStudent.bind(studentController));
router.post('/:id/reactivate', requirePermission('students.delete'), studentController.reactivateStudent.bind(studentController));
router.delete('/:id', requirePermission('students.delete'), studentController.deleteStudent.bind(studentController));

export default router;
