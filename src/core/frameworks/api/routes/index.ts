import { Router } from 'express';
import authRoutes from './auth.routes';
import schoolsRoutes from './schools.routes';
import usersRoutes from './users.routes';
import studentsRoutes from './students.routes';

const router = Router();

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
const v1Router = Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/schools', schoolsRoutes);
v1Router.use('/users', usersRoutes);
v1Router.use('/students', studentsRoutes);

router.use('/v1', v1Router);

export default router;

