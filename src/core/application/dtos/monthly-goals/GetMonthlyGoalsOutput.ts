import { Prisma } from '@prisma/client';

export type GetMonthlyGoalsOutput = {
  templates: Prisma.MonthlyGoalTemplateGetPayload<{}>[];
  percentages: Prisma.QuarterGradePercentageGetPayload<{}>[];
};
