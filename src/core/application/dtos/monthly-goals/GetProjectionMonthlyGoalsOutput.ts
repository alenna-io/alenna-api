import { Prisma } from '@prisma/client';

export type GetProjectionMonthlyGoalsOutput = Prisma.ProjectionMonthlyGoalGetPayload<{
  include: {
    monthlyGoalTemplate: true;
    gradeHistory: true;
  };
}>[];
