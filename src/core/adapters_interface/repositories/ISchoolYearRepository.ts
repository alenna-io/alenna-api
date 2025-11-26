import type { SchoolYear, CurrentWeekInfo } from '../../domain/entities';

export interface ISchoolYearRepository {
  // School Year CRUD
  findById(id: string): Promise<SchoolYear | null>;
  findBySchoolId(schoolId: string): Promise<SchoolYear[]>;
  findActiveBySchoolId(schoolId: string): Promise<SchoolYear | null>;
  create(data: CreateSchoolYearData): Promise<SchoolYear>;
  update(id: string, data: UpdateSchoolYearData): Promise<SchoolYear>;
  delete(id: string): Promise<void>;
  setActive(id: string, schoolId: string): Promise<SchoolYear>; // Deactivates others and activates this one

  // Current week calculation
  getCurrentWeek(schoolId: string): Promise<CurrentWeekInfo | null>;
}

export interface CreateSchoolYearData {
  schoolId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  quarters: CreateQuarterData[];
}

export interface CreateQuarterData {
  name: string;
  displayName: string;
  startDate: Date;
  endDate: Date;
  order: number;
  weeksCount?: number;
  // Optional detailed configuration coming from the wizard
  weeks?: QuarterWeekInput[];
  holidays?: QuarterHolidayInput[];
}

export interface UpdateSchoolYearData {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  quarters?: UpdateQuarterData[];
}

export interface UpdateQuarterData {
  id?: string; // If provided, update existing; otherwise create new
  name?: string;
  displayName?: string;
  startDate?: Date;
  endDate?: Date;
  order?: number;
  weeksCount?: number;
  weeks?: QuarterWeekInput[];
  holidays?: QuarterHolidayInput[];
}

export interface QuarterWeekInput {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
}

export interface QuarterHolidayInput {
  startDate: Date;
  endDate: Date;
  label?: string;
}

