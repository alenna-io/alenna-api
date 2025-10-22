import { Router, type Router as ExpressRouter } from 'express';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { container } from '../../di/container';
import { attachUserContext, requirePermission } from '../middleware';

const router: ExpressRouter = Router();
const schoolYearController = container.schoolYearController;

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);

// GET /api/v1/school-years/current-week - Get current week info (all authenticated users)
router.get('/current-week', schoolYearController.getCurrentWeek);

// GET /api/v1/school-years - List all school years
router.get('/', requirePermission('schoolYear.read'), schoolYearController.getSchoolYears);

// GET /api/v1/school-years/:id - Get specific school year
router.get('/:id', requirePermission('schoolYear.read'), schoolYearController.getSchoolYearById);

// POST /api/v1/school-years - Create school year (Admin only)
router.post('/', requirePermission('schoolYear.create'), schoolYearController.createSchoolYear);

// PUT /api/v1/school-years/:id - Update school year (Admin only)
router.put('/:id', requirePermission('schoolYear.update'), schoolYearController.updateSchoolYear);

// DELETE /api/v1/school-years/:id - Delete school year (Admin only)
router.delete('/:id', requirePermission('schoolYear.delete'), schoolYearController.deleteSchoolYear);

// POST /api/v1/school-years/:id/activate - Set as active school year (Admin only)
router.post('/:id/activate', requirePermission('schoolYear.update'), schoolYearController.setActiveSchoolYear);

export default router;

