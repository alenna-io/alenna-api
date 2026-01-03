import { RecurringExtraCharge } from '../../domain/entities';

export interface IRecurringExtraChargeRepository {
  create(charge: RecurringExtraCharge): Promise<RecurringExtraCharge>;
  update(id: string, charge: Partial<RecurringExtraCharge>): Promise<RecurringExtraCharge>;
  findActiveBySchoolId(schoolId: string): Promise<RecurringExtraCharge[]>;
  findById(id: string, schoolId: string): Promise<RecurringExtraCharge | null>;
  findByStudentId(studentId: string, schoolId: string): Promise<RecurringExtraCharge[]>;
  findActiveByStudentIdAndDate(
    studentId: string,
    billingMonth: number,
    billingYear: number,
    schoolId: string
  ): Promise<RecurringExtraCharge[]>;
  delete(id: string, schoolId: string): Promise<void>;
}