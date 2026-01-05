import { Router, type Router as ExpressRouter } from 'express';
import projectionRoutes from './projections.routes';

const router: ExpressRouter = Router();

// Health check (no auth required, no versioning)
router.get('/v2/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: 'v2',
  });
});

// API v2 routes
const v2Router: ExpressRouter = Router();

v2Router.use('/projections', projectionRoutes);

router.use('/v2', v2Router);

export default router;