import { Router, type Router as ExpressRouter } from 'express';
import { UserController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation, requirePermission, requireAnyPermission } from '../middleware';

const router: ExpressRouter = Router();
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
router.get('/', requirePermission('users.read'), userController.getUsers.bind(userController));
// Roles can be fetched either via Users module or Teachers module (for school admins creating teachers)
router.get('/roles', requireAnyPermission('users.create', 'teachers.create'), userController.getAvailableRoles.bind(userController));
// Creating users is allowed either via Users module (users.create) or Teachers module (teachers.create)
router.post('/', requireAnyPermission('users.create', 'teachers.create'), userController.createUser.bind(userController));
// Allow users to update their own profile without users.update permission
router.put('/me', userController.updateMyProfile.bind(userController));
router.put('/:id', requirePermission('users.update'), userController.updateUser.bind(userController));
router.post('/:id/deactivate', requirePermission('users.delete'), userController.deactivateUser.bind(userController));
router.post('/:id/reactivate', requirePermission('users.delete'), userController.reactivateUser.bind(userController));
router.delete('/:id', requirePermission('users.delete'), userController.deleteUser.bind(userController));

export default router;

