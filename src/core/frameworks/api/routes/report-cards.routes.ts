import { Router, type Router as ExpressRouter } from 'express';
import { requireAnyPermission } from '../middleware/permission.middleware';
import { container } from '../../di/container';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation } from '../middleware';

const router: ExpressRouter = Router({ mergeParams: true });
const reportCardController = container.reportCardController;

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

router.get(
  '/',
  requireAnyPermission('reportCards.read', 'reportCards.readOwn'),
  reportCardController.getReportCard.bind(reportCardController)
);

export default router;
