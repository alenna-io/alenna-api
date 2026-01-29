import { Prisma } from '@prisma/client';

export type GetProjectionMonthlyAssignmentsOutput = Prisma.ProjectionMonthlyAssignmentGetPayload<{
  include: {
    monthlyAssignmentTemplate: true;
    gradeHistory: true;
  };
}>[];
