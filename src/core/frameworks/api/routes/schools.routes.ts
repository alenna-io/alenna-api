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

export default router;

