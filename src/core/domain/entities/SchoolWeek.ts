export interface SchoolWeek {
  id: string;
  quarterId: string;
  weekNumber: number; // 1..N within the quarter
  startDate: Date;
  endDate: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
