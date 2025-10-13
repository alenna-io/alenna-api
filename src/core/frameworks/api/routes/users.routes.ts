import { Router } from 'express';
import { UserController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, requireRole, ensureTenantIsolation } from '../middleware';

const router = Router();
const userController = new UserController();

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

// All routes
router.get('/', userController.getUsers.bind(userController));
router.put('/:id', userController.updateUser.bind(userController));
router.delete('/:id', requireRole('ADMIN'), userController.deleteUser.bind(userController));

export default router;

