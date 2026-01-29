import { Router, type Router as ExpressRouter } from 'express';
import projectionRoutes from './projections.routes';
import categoryRoutes from './categories.routes';
import schoolRoutes from './schools.routes';
import studentRoutes from './students.routes';
import subjectRoutes from './subjects.routes';
import paceCatalogRoutes from './pace-catalog.routes';
import dailyGoalsRoutes from './daily-goals.routes';
import monthlyAssignmentsRoutes from './monthly-assignments.routes';

const router: ExpressRouter = Router();

// Health check (no auth required, no versioning)
router.get('/v2/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: 'v1',
  });
});

// API v1 routes
const v1Router: ExpressRouter = Router();

v1Router.use('/categories', categoryRoutes);
v1Router.use('/projections', projectionRoutes);
v1Router.use('/schools', schoolRoutes);
v1Router.use('/students', studentRoutes);
v1Router.use('/subjects', subjectRoutes);
v1Router.use('/pace-catalog', paceCatalogRoutes);
v1Router.use('/daily-goals', dailyGoalsRoutes);
v1Router.use('/monthly-assignments', monthlyAssignmentsRoutes);

router.use('/v1', v1Router);

export default router;