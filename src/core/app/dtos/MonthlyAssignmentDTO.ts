// Input DTOs
export interface CreateMonthlyAssignmentInput {
  name: string;
  quarter: string; // Q1, Q2, Q3, Q4
}

export interface UpdateMonthlyAssignmentInput {
  name?: string;
}

export interface GradeMonthlyAssignmentInput {
  grade: number; // 0-100
  note?: string;
}

// Output DTOs
export interface MonthlyAssignmentGradeHistoryOutput {
  id: string;
  grade: number;
  date: string; // ISO date string
  note?: string;
}

export interface MonthlyAssignmentOutput {
  id: string;
  name: string;
  quarter: string;
  grade: number | null;
  gradeHistory: MonthlyAssignmentGradeHistoryOutput[];
  createdAt: string;
  updatedAt: string;
}

// Organized by quarter
export interface QuarterMonthlyAssignmentsOutput {
  [quarter: string]: MonthlyAssignmentOutput[]; // Q1, Q2, Q3, Q4
}

