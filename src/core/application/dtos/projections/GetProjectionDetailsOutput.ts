import { z } from 'zod';

export const ProjectionPaceDetailsSchema = z.object({
  id: z.string(),
  projectionId: z.string(),
  paceCatalogId: z.string(),
  quarter: z.string(),
  week: z.number().int(),
  grade: z.number().int().nullable(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'UNFINISHED']),
  originalQuarter: z.string().nullable(),
  originalWeek: z.number().int().nullable(),
  paceCatalog: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    orderIndex: z.number().int(),
    subject: z.object({
      id: z.string(),
      name: z.string(),
      category: z.object({
        id: z.string(),
        name: z.string(),
        displayOrder: z.number().int(),
      }),
    }),
  }),
  gradeHistory: z.array(z.object({
    id: z.string(),
    grade: z.number().int(),
    date: z.string().datetime(),
    note: z.string().nullable(),
  })),
});

export const DailyGoalDetailsSchema = z.object({
  id: z.string(),
  subject: z.string(),
  quarter: z.string(),
  week: z.number().int(),
  dayOfWeek: z.number().int(),
  text: z.string(),
  isCompleted: z.boolean(),
  notes: z.string().nullable(),
  notesCompleted: z.boolean(),
});

export const ProjectionSubjectDetailsSchema = z.object({
  id: z.string(),
  projectionId: z.string(),
  subjectId: z.string(),
  subject: z.object({
    id: z.string(),
    name: z.string(),
    category: z.object({
      id: z.string(),
      name: z.string(),
      displayOrder: z.number().int(),
    }),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const GetProjectionDetailsOutputSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  schoolId: z.string(),
  schoolYear: z.string(),
  schoolYearName: z.string(),
  status: z.enum(['OPEN', 'CLOSED']),
  student: z.object({
    id: z.string(),
    user: z.object({
      id: z.string(),
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
    }),
  }),
  projectionPaces: z.array(ProjectionPaceDetailsSchema),
  projectionSubjects: z.array(ProjectionSubjectDetailsSchema),
  dailyGoals: z.array(DailyGoalDetailsSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProjectionSubjectDetails = z.infer<typeof ProjectionSubjectDetailsSchema>;
export type GetProjectionDetailsOutput = z.infer<typeof GetProjectionDetailsOutputSchema>;
