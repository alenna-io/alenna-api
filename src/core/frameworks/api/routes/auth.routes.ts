import { Router, type Router as ExpressRouter } from 'express';
import { AuthController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext } from '../middleware';

const router: ExpressRouter = Router();
const authController = new AuthController();

// Apply Clerk middleware to all routes
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));

// Sync/validate user from Clerk (protected - validates user exists in database)
router.post('/sync', requireAuth(), authController.syncUser.bind(authController));

// Get current authenticated user (protected)
router.get('/me', requireAuth(), attachUserContext, authController.getCurrentUser.bind(authController));

// Get current user info with roles (protected)
router.get('/info', requireAuth(), attachUserContext, authController.getUserInfo.bind(authController));

export default router;

