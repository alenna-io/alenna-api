import { Router, type Router as ExpressRouter } from 'express';
import { ProjectionController } from '../../controllers/v2';
import { container } from '../../../di/v2/container';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import {
  attachUserContext,
  ensureTenantIsolation,
  requirePermission,
  validateBody,
} from '../../middleware';
import { CreateProjectionDTO } from '../../../../app/dtos/v2/projections/CreateProjectionInput';

const router: ExpressRouter = Router({ mergeParams: true }); // mergeParams to access studentId from parent route
const projectionController = new ProjectionController(
  container.useCase.createProjectionUseCase
);

// Apply Clerk middleware and authentication
// router.use(clerkMiddleware({
//   publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
//   secretKey: process.env.CLERK_SECRET_KEY!,
// }));
// router.use(requireAuth());
// router.use(attachUserContext);
// router.use(ensureTenantIsolation);

// Routes
router.post(
  '/',
  // requirePermission('projections.create'),
  validateBody(CreateProjectionDTO),
  projectionController.create.bind(projectionController)
);

export default router;

