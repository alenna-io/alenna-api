import { Router, type Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes';
import schoolsRoutes from './schools.routes';
import usersRoutes from './users.routes';
import studentsRoutes from './students.routes';
import projectionsRoutes from './projections.routes';
import paceCatalogRoutes from './pace-catalog.routes';

const router: ExpressRouter = Router();

// Health check (no auth required, no versioning)
router.get('/health', (req, res) => {
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

router.use('/v1', v1Router);

export default router;

