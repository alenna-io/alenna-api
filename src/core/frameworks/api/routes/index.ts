import { Router, type Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes';
import schoolsRoutes from './schools.routes';
import usersRoutes from './users.routes';
import studentsRoutes from './students.routes';
import projectionsRoutes from './projections.routes';
import paceCatalogRoutes from './pace-catalog.routes';
import moduleRoutes from './modules.routes';
import schoolYearRoutes from './school-years.routes';

const router: ExpressRouter = Router();

// Health check (no auth required, no versioning)
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: 'v1',
  });
});

// API v1 routes
const v1Router: ExpressRouter = Router();
  v1Router.use('/auth', authRoutes);
  v1Router.use('/schools', schoolsRoutes);
  v1Router.use('/users', usersRoutes);
  v1Router.use('/students/:studentId/projections', projectionsRoutes); // Nested route
  v1Router.use('/students', studentsRoutes);
  v1Router.use('/pace-catalog', paceCatalogRoutes);
  v1Router.use('/modules', moduleRoutes);
  v1Router.use('/school-years', schoolYearRoutes);

router.use('/v1', v1Router);

export default router;

