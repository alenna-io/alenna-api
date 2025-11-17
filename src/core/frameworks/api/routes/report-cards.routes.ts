import { Router, type Router as ExpressRouter } from 'express';
import { requireAnyPermission } from '../middleware/permission.middleware';
import { container } from '../../di/container';

const router: ExpressRouter = Router({ mergeParams: true });
const reportCardController = container.reportCardController;

router.get(
  '/',
  requireAnyPermission('reportCards.read', 'reportCards.readOwn'),
  reportCardController.getReportCard.bind(reportCardController)
);

export default router;

