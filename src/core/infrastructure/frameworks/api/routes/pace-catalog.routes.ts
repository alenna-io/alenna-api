import { Router, type Router as ExpressRouter } from 'express';
import { container } from '../../di/container';
import { PaceCatalogController } from '../../../../presentation/controllers';
import { asyncHandler } from '../../../../../utils';
import { attachUserContext } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();
const paceCatalogController = new PaceCatalogController(
  container.repository.paceCatalogRepository
);

// Apply authentication middleware (MVP: hardcoded user)
router.use(attachUserContext);

// Routes
router.get(
  '/',
  asyncHandler(paceCatalogController.get.bind(paceCatalogController))
);

export default router;
