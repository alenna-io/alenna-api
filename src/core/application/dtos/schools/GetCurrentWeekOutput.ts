export interface CurrentWeekInfo {
  schoolYear: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    quarters: Array<{
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
      order: number;
      weeksCount: number;
    }>;
  };
  currentQuarter: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    order: number;
    weeksCount: number;
  } | null;
  currentWeek: number | null;
  weekStartDate: Date | null;
  weekEndDate: Date | null;
}
