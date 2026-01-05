import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation, cacheMiddleware } from '../middleware';

const router: ExpressRouter = Router({ mergeParams: true });
const subSubjectController = container.subSubjectController;

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

router.get('/__test', (_req, res) => {
  res.json({ ok: true });
});

// GET /sub-subjects
router.get(
  '/',
  cacheMiddleware({ maxAge: 1800, staleWhileRevalidate: 3600 }),
  subSubjectController.getSubSubjects.bind(subSubjectController)
);

// POST /sub-subjects
router.post('/', subSubjectController.createSubSubject.bind(subSubjectController));

export default router;

