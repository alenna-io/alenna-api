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
  GenerateProjectionDTO,
  MovePaceDTO,
  AddPaceDTO,
  UpdateGradeDTO
} from '../../../../application/dtos/projections';
import { asyncHandler } from '../../../../../utils';

const router: ExpressRouter = Router({ mergeParams: true }); // mergeParams to access studentId from parent route
const projectionController = new ProjectionController(
  container.useCase.createProjectionUseCase,
  container.useCase.generateProjectionUseCase,
  container.useCase.getProjectionListUseCase,
  container.useCase.getProjectionDetailsUseCase,
  container.useCase.movePaceUseCase,
  container.useCase.addPaceUseCase,
  container.useCase.deletePaceUseCase,
  container.useCase.updateGradeUseCase,
  container.useCase.markUngradedUseCase
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
router.get(
  '/',
  asyncHandler(projectionController.getList.bind(projectionController))
);

router.get(
  '/:id',
  asyncHandler(projectionController.getById.bind(projectionController))
);

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

router.patch(
  '/:id/paces/:paceId/move',
  validateBody(MovePaceDTO),
  asyncHandler(projectionController.movePaceHandler.bind(projectionController))
);

router.post(
  '/:id/paces',
  validateBody(AddPaceDTO),
  asyncHandler(projectionController.addPaceHandler.bind(projectionController))
);

router.delete(
  '/:id/paces/:paceId',
  asyncHandler(projectionController.deletePaceHandler.bind(projectionController))
);

router.patch(
  '/:id/paces/:paceId/grade',
  validateBody(UpdateGradeDTO),
  asyncHandler(projectionController.updateGradeHandler.bind(projectionController))
);

router.patch(
  '/:id/paces/:paceId/mark-ungraded',
  asyncHandler(projectionController.markUngradedHandler.bind(projectionController))
);

export default router;
