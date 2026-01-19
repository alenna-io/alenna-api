import { Router, type Router as ExpressRouter } from 'express';
import projectionRoutes from './projections.routes';

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

v1Router.use('/projections', projectionRoutes);

router.use('/v1', v1Router);

export default router;