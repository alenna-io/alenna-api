import { Router, type Router as ExpressRouter } from 'express';
import { BillingController } from '../controllers';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { attachUserContext, ensureTenantIsolation, requirePermission } from '../middleware';

const router: ExpressRouter = Router();
const billingController = new BillingController();

router.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
}));
router.use(requireAuth());
router.use(attachUserContext);
router.use(ensureTenantIsolation);

// Specific routes must come before parameterized routes
router.get('/aggregated-financials', requirePermission('billing.read'), billingController.getAggregatedFinancials.bind(billingController));
router.get('/records', requirePermission('billing.read'), billingController.getBillingRecords.bind(billingController));
router.get('/metrics', requirePermission('billing.read'), billingController.getBillingMetrics.bind(billingController));
router.get('/dashboard', requirePermission('billing.read'), billingController.getBillingDashboard.bind(billingController));
router.post('/bulk', requirePermission('billing.create'), billingController.bulkCreateBillingRecords.bind(billingController));
router.put('/bulk-update', requirePermission('billing.update'), billingController.bulkUpdateBillingRecords.bind(billingController));
router.post('/bulk-apply-late-fee', requirePermission('billing.update'), billingController.bulkApplyLateFee.bind(billingController));

router.get('/tuition-config', requirePermission('billing.read'), billingController.getTuitionConfig.bind(billingController));
router.post('/tuition-config', requirePermission('billing.create'), billingController.createTuitionConfig.bind(billingController));
router.put('/tuition-config/:id', requirePermission('billing.update'), billingController.updateTuitionConfig.bind(billingController));

router.get('/tuition-types', requirePermission('billing.read'), billingController.getTuitionTypes.bind(billingController));
router.get('/tuition-types/:id', requirePermission('billing.read'), billingController.getTuitionTypeById.bind(billingController));
router.post('/tuition-types', requirePermission('billing.create'), billingController.createTuitionType.bind(billingController));
router.put('/tuition-types/:id', requirePermission('billing.update'), billingController.updateTuitionType.bind(billingController));
router.delete('/tuition-types/:id', requirePermission('billing.delete'), billingController.deleteTuitionType.bind(billingController));

router.get('/students/scholarships', requirePermission('billing.read'), billingController.getStudentsWithScholarships.bind(billingController));
router.get('/students/:studentId/scholarship', requirePermission('billing.read'), billingController.getStudentScholarship.bind(billingController));
router.post('/students/:studentId/scholarship', requirePermission('billing.create'), billingController.createStudentScholarship.bind(billingController));
router.put('/students/:studentId/scholarship', requirePermission('billing.update'), billingController.updateStudentScholarship.bind(billingController));

// Parameterized routes must come last
router.get('/:id', requirePermission('billing.read'), billingController.getBillingRecordById.bind(billingController));
router.post('/', requirePermission('billing.create'), billingController.createBillingRecord.bind(billingController));
router.put('/:id', requirePermission('billing.update'), billingController.updateBillingRecord.bind(billingController));
router.post('/:id/record-payment', requirePermission('billing.update'), billingController.recordManualPayment.bind(billingController));
router.post('/:id/record-partial-payment', requirePermission('billing.update'), billingController.recordPartialPayment.bind(billingController));
router.post('/:id/apply-late-fee', requirePermission('billing.update'), billingController.applyLateFee.bind(billingController));

export default router;
