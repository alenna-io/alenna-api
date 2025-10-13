import { Router } from 'express';
import authRoutes from './auth.routes';
import schoolsRoutes from './schools.routes';
import usersRoutes from './users.routes';
import studentsRoutes from './students.routes';

const router = Router();

// Health check (no auth required)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/schools', schoolsRoutes);
router.use('/users', usersRoutes);
router.use('/students', studentsRoutes);

export default router;

