export interface QuarterHoliday {
  id: string;
  schoolYearId: string;
  quarterId?: string | null;
  startDate: Date;
  endDate: Date;
  label?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
