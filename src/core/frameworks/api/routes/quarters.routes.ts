import { Router, type Router as ExpressRouter } from 'express';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { QuarterController } from '../controllers/QuarterController';
import { attachUserContext, requirePermission } from '../middleware';

const router: ExpressRouter = Router();
const quarterController = new QuarterController();

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);

// IMPORTANT: /status must come before /:id/close to avoid route matching conflicts
router.get(
  '/status',
  requirePermission('quarters.read'),
  quarterController.getQuartersStatus.bind(quarterController)
);

router.post(
  '/:id/close',
  requirePermission('quarters.close'),
  quarterController.closeQuarter.bind(quarterController)
);

export default router;

