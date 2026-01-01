import { TuitionType } from '../../domain/entities';

export interface ITuitionTypeRepository {
  findById(id: string, schoolId: string): Promise<TuitionType | null>;
  findBySchoolId(schoolId: string): Promise<TuitionType[]>;
  create(tuitionType: TuitionType): Promise<TuitionType>;
  update(id: string, tuitionType: Partial<TuitionType>, schoolId: string): Promise<TuitionType>;
  delete(id: string, schoolId: string): Promise<void>;
}

