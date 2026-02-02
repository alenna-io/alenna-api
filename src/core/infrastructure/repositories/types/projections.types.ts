import { Prisma } from '@prisma/client';

export type ProjectionWithStudent = Prisma.ProjectionGetPayload<{
  include: {
    student: {
      include: {
        user: true;
      };
    };
    _count: {
      select: {
        projectionPaces: true;
      };
    };
  };
}>;

export type ProjectionWithDetails = Prisma.ProjectionGetPayload<{
  include: {
    student: {
      include: {
        user: true;
      };
    };
    projectionPaces: {
      include: {
        paceCatalog: {
          include: {
            subject: {
              include: {
                category: true;
              };
            };
          };
        };
        gradeHistory: true;
      };
    };
    projectionSubjects: {
      include: {
        subject: {
          include: {
            category: true;
          };
        };
      };
    };
    dailyGoals: true;
  };
}>;
