import { Router } from 'express';
import { SchoolController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, requireRole } from '../middleware';

const router = Router();
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
router.get('/me', schoolController.getMySchool.bind(schoolController));

// Update current user's school (Admin only)
router.put('/me', requireRole('ADMIN'), schoolController.updateSchool.bind(schoolController));

export default router;

