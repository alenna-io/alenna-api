import { Router } from 'express';
import { StudentController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation } from '../middleware';

const router = Router();
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
router.get('/', studentController.getStudents.bind(studentController));
router.get('/:id', studentController.getStudent.bind(studentController));
router.post('/', studentController.createStudent.bind(studentController));
router.put('/:id', studentController.updateStudent.bind(studentController));
router.delete('/:id', studentController.deleteStudent.bind(studentController));

export default router;

