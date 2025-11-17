import { Router, type Router as ExpressRouter } from 'express';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { container } from '../../di/container';
import { attachUserContext, requirePermission } from '../middleware';

const router: ExpressRouter = Router();
const controller = container.schoolMonthlyAssignmentController;

// Apply Clerk middleware and authentication
router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);

// GET /api/v1/school-monthly-assignments/:schoolYearId/templates - Get all templates for a school year
router.get('/:schoolYearId/templates', requirePermission('monthlyAssignment.read'), controller.getTemplates);

// POST /api/v1/school-monthly-assignments/templates - Create a template (applies to all students)
router.post('/templates', requirePermission('monthlyAssignment.create'), controller.createTemplate);

// PUT /api/v1/school-monthly-assignments/templates/:templateId - Update a template
router.put('/templates/:templateId', requirePermission('monthlyAssignment.update'), controller.updateTemplate);

// DELETE /api/v1/school-monthly-assignments/templates/:templateId - Delete a template
router.delete('/templates/:templateId', requirePermission('monthlyAssignment.delete'), controller.deleteTemplate);

// GET /api/v1/school-monthly-assignments/:schoolYearId/grade-percentages - Get grade percentages per quarter
router.get('/:schoolYearId/grade-percentages', requirePermission('monthlyAssignment.read'), controller.getGradePercentages);

// PUT /api/v1/school-monthly-assignments/grade-percentages - Update grade percentage for a quarter
router.put('/grade-percentages', requirePermission('monthlyAssignment.update'), controller.updateGradePercentage);

export default router;

