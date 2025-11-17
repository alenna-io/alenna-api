import prisma from '../../../frameworks/database/prisma.client';

export interface ProjectionWithStudent {
  id: string;
  studentId: string;
  schoolYear: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
  };
}

export class GetAllProjectionsUseCase {
  async execute(schoolId: string, year?: string): Promise<ProjectionWithStudent[]> {
    // Determine current school year if not provided (e.g., "2024-2025")
    // Assuming school years start in August/September
    let schoolYearFilter: string | undefined;
    
    if (!year) {
      const now = new Date();
      const month = now.getMonth(); // 0-11
      let schoolYearStart: number;
      let schoolYearEnd: number;
      
      if (month >= 7) { // August or later
        schoolYearStart = now.getFullYear();
        schoolYearEnd = now.getFullYear() + 1;
      } else { // Before August
        schoolYearStart = now.getFullYear() - 1;
        schoolYearEnd = now.getFullYear();
      }
      
      schoolYearFilter = `${schoolYearStart}-${schoolYearEnd}`;
    } else {
      schoolYearFilter = year;
    }
    
    // Find all projections for students in this school
    const projections = await prisma.projection.findMany({
      where: {
        deletedAt: null,
        schoolYear: schoolYearFilter, // Filter by current school year by default
        student: {
          schoolId,
          deletedAt: null,
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [
        { student: { user: { lastName: 'asc' } } },
        { student: { user: { firstName: 'asc' } } },
        { schoolYear: 'desc' },
      ],
    });

    return projections.map(p => ({
      id: p.id,
      studentId: p.studentId,
      schoolYear: p.schoolYear,
      startDate: p.startDate,
      endDate: p.endDate,
      isActive: p.isActive,
      notes: p.notes || undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      student: {
        id: p.student.id,
        firstName: p.student.user.firstName || '',
        lastName: p.student.user.lastName || '',
        name: `${p.student.user.firstName || ''} ${p.student.user.lastName || ''}`.trim(),
      },
    }));
  }
}

