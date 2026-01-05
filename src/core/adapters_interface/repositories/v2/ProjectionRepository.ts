import { Projection } from '../../../domain/entities/v2/Projection';

export interface ProjectionRepository {
  findActiveByStudent(
    studentId: string,
    schoolId: string,
    schoolYear: string,
  ): Promise<Projection | null>;

  create(input: {
    studentId: string;
    schoolId: string;
    schoolYear: string;
  }): Promise<Projection>;
}