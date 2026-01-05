import { Student } from '@prisma/client';

export interface ReportCardProjection {
  id: string;
  studentId: string;
  schoolYear: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  student: Student;
}