import { Router } from 'express';
import { AuthController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext } from '../middleware';

const router = Router();
const authController = new AuthController();

// Apply Clerk middleware to all routes
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));

// Sync user from Clerk (public - for initial registration)
router.post('/sync', authController.syncUser.bind(authController));

// Get current authenticated user (protected)
router.get('/me', requireAuth(), attachUserContext, authController.getCurrentUser.bind(authController));

export default router;

