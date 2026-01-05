import { Quarter, QuarterGradePercentage } from './';

export interface SchoolYear {
  id: string;
  schoolId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  quarters?: Quarter[];
  quarterGradePercentages?: QuarterGradePercentage[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// export interface Quarter {
//   id: string;
//   schoolYearId: string;
//   name: string; // Q1, Q2, Q3, Q4
//   displayName: string; // "Bloque 1", etc.
//   startDate: Date;
//   endDate: Date;
//   order: number;
//   weeksCount: number;
//   isClosed: boolean;
//   closedAt?: Date;
//   closedBy?: string;
//   // Optional detailed configuration
//   schoolWeeks?: import('./SchoolWeek').SchoolWeek[];
//   holidays?: import('./QuarterHoliday').QuarterHoliday[];
//   deletedAt?: Date;
//   createdAt: Date;
//   updatedAt: Date;
// }

export interface CurrentWeekInfo {
  schoolYear: SchoolYear;
  currentQuarter: Quarter | null;
  currentWeek: number | null; // 1-9 within the quarter
  weekStartDate: Date | null;
  weekEndDate: Date | null;
}

