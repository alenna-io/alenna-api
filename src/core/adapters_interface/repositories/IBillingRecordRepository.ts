import { BillingRecord } from '../../domain/entities';

export interface IBillingRecordRepository {
  findById(id: string, schoolId: string): Promise<BillingRecord | null>;
  findByStudentId(studentId: string, schoolId: string): Promise<BillingRecord[]>;
  findByMonthAndYear(studentId: string, billingMonth: number, billingYear: number, schoolId: string): Promise<BillingRecord | null>;
  findBySchoolYear(schoolYearId: string, schoolId: string): Promise<BillingRecord[]>;
  findUnpaidBills(schoolId: string, startDate?: Date, endDate?: Date): Promise<BillingRecord[]>;
  findBillsRequiringLateFee(schoolId: string, dueDate: Date): Promise<BillingRecord[]>;
  findByFilters(filters: {
    schoolId: string;
    studentId?: string;
    schoolYearId?: string;
    billingMonth?: number;
    billingYear?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<BillingRecord[]>;
  create(billingRecord: BillingRecord): Promise<BillingRecord>;
  createMany(billingRecords: BillingRecord[]): Promise<BillingRecord[]>;
  update(id: string, billingRecord: Partial<BillingRecord>, schoolId: string): Promise<BillingRecord>;
  delete(id: string, schoolId: string): Promise<void>;
  getMetrics(filters: {
    schoolId: string;
    startDate?: Date;
    endDate?: Date;
    schoolYearId?: string;
  }): Promise<{
    totalIncome: number;
    expectedIncome: number;
    missingIncome: number;
    totalStudentsPaid: number;
    totalStudentsNotPaid: number;
    lateFeesApplied: number;
  }>;
  getDashboardData(filters: {
    schoolId: string;
    startDate: Date;
    endDate: Date;
    schoolYearId?: string;
  }): Promise<Array<{
    month: number;
    year: number;
    expectedIncome: number;
    actualIncome: number;
    missingIncome: number;
    paidCount: number;
    unpaidCount: number;
    lateFeesApplied: number;
  }>>;
}

