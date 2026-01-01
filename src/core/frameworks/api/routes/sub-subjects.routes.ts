import { Router, type Router as ExpressRouter } from 'express';
import { SubSubjectController } from '../controllers/SubSubjectController';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation } from '../middleware';

const router: ExpressRouter = Router();
const subSubjectController = new SubSubjectController();

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

// GET /sub-subjects
router.get('/', subSubjectController.getSubSubjects.bind(subSubjectController));

// POST /sub-subjects
router.post('/', subSubjectController.createSubSubject.bind(subSubjectController));

export default router;

