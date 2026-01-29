import { Prisma } from '@prisma/client';

export type GetMonthlyAssignmentsOutput = {
  templates: Prisma.MonthlyAssignmentTemplateGetPayload<{}>[];
  percentages: Prisma.QuarterGradePercentageGetPayload<{}>[];
};
