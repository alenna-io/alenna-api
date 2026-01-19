import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { ProjectionController } from '../../../../presentation/controllers';
// import { clerkMiddleware, requireAuth } from '@clerk/express';
import {
  attachUserContext,
  // ensureTenantIsolation,
  // requirePermission,
  validateBody,
} from '../middleware';
import {
  CreateProjectionDTO,
  GenerateProjectionDTO
} from '../../../../application/dtos/projections';
import { asyncHandler } from '../../../../../utils';

const router: ExpressRouter = Router({ mergeParams: true }); // mergeParams to access studentId from parent route
const projectionController = new ProjectionController(
  container.useCase.createProjectionUseCase,
  container.useCase.generateProjectionUseCase
);

// Apply Clerk middleware and authentication
// router.use(clerkMiddleware({
//   publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
//   secretKey: process.env.CLERK_SECRET_KEY!,
// }));
// router.use(requireAuth());
// router.use(ensureTenantIsolation);

// Apply authentication middleware (MVP: hardcoded user)
router.use(attachUserContext);

// Routes
router.post(
  '/',
  // requirePermission('projections.create'),
  validateBody(CreateProjectionDTO),
  asyncHandler(projectionController.create.bind(projectionController))
);

router.post(
  '/generate',
  validateBody(GenerateProjectionDTO),
  asyncHandler(projectionController.generate.bind(projectionController))
);

export default router;
