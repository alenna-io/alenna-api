import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { PaceCatalogController } from '../../../../presentation/controllers';
import { asyncHandler } from '../../../../../utils';
import { attachUserContext, requireSchoolAdmin } from '../middleware';

const router: ExpressRouter = Router();
const paceCatalogController = new PaceCatalogController(
  container.repository.paceCatalogRepository
);

router.use(attachUserContext);
router.use(requireSchoolAdmin);

// Routes
router.get(
  '/',
  asyncHandler(paceCatalogController.get.bind(paceCatalogController))
);

export default router;
