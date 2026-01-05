import { Router, type Router as ExpressRouter } from 'express';
import authRoutes from './auth.routes';
import schoolsRoutes from './schools.routes';
import usersRoutes from './users.routes';
import studentsRoutes from './students.routes';
import projectionsRoutes from './projections.routes';
import projectionsListRoutes from './projections-list.routes';
import dailyGoalsRoutes from './daily-goals.routes';
import monthlyAssignmentsRoutes from './monthlyAssignments.routes';
import paceCatalogRoutes from './pace-catalog.routes';
import subSubjectsRoutes from './sub-subjects.routes';
import projectionTemplatesRoutes from './projection-templates.routes';
import moduleRoutes from './modules.routes';
import schoolYearRoutes from './school-years.routes';
import schoolMonthlyAssignmentsRoutes from './school-monthly-assignments.routes';
import reportCardsRoutes from './report-cards.routes';
import groupsRoutes from './groups.routes';
import quartersRoutes from './quarters.routes';
import billingRoutes from './billing.routes';

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
v1Router.use('/projections', projectionsListRoutes); // All projections route
v1Router.use('/students/:studentId/projections', projectionsRoutes); // Nested route
v1Router.use('/students/:studentId/projections/:projectionId/daily-goals', dailyGoalsRoutes); // Nested daily goals route
v1Router.use('/students/:studentId/projections/:projectionId/monthly-assignments', monthlyAssignmentsRoutes); // Nested monthly assignments route
v1Router.use('/students', studentsRoutes);
v1Router.use('/pace-catalog', paceCatalogRoutes);
v1Router.use('/sub-subjects', subSubjectsRoutes);
v1Router.use('/projection-templates', projectionTemplatesRoutes);
v1Router.use('/modules', moduleRoutes);
v1Router.use('/school-years', schoolYearRoutes);
v1Router.use('/school-monthly-assignments', schoolMonthlyAssignmentsRoutes);
v1Router.use('/students/:studentId/projections/:projectionId/report-card', reportCardsRoutes);
v1Router.use('/groups', groupsRoutes);
v1Router.use('/quarters', quartersRoutes);
v1Router.use('/billing', billingRoutes);

router.use('/v1', v1Router);

export default router;

