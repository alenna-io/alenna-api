// DTOs for Pace and related data

export interface GradeHistoryOutput {
  id: string;
  grade: number;
  date: string; // ISO date string
  note?: string;
}

export interface PaceOutput {
  id: string;
  number: string;
  subject: string;
  quarter: string;
  week: number;
  grade: number | null;
  isCompleted: boolean;
  isFailed: boolean;
  comments?: string;
  gradeHistory: GradeHistoryOutput[];
  createdAt: string;
  updatedAt: string;
}

// Organized pace data by quarter, subject, and week
export interface QuarterPacesOutput {
  [subject: string]: (PaceOutput | null)[]; // Array indexed by week (0-8 for weeks 1-9)
}

export interface StudentInfoOutput {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  age: number;
  currentLevel?: string;
  certificationType: string;
}

export interface ProjectionDetailOutput {
  id: string;
  studentId: string;
  student: StudentInfoOutput;
  schoolYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  quarters: {
    Q1: QuarterPacesOutput;
    Q2: QuarterPacesOutput;
    Q3: QuarterPacesOutput;
    Q4: QuarterPacesOutput;
  };
}

