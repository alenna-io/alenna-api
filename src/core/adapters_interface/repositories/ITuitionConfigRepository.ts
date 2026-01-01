import { TuitionConfig } from '../../domain/entities';

export interface ITuitionConfigRepository {
  findBySchoolId(schoolId: string): Promise<TuitionConfig | null>;
  create(tuitionConfig: TuitionConfig): Promise<TuitionConfig>;
  update(id: string, tuitionConfig: Partial<TuitionConfig>, schoolId: string): Promise<TuitionConfig>;
  delete(id: string, schoolId: string): Promise<void>;
}

