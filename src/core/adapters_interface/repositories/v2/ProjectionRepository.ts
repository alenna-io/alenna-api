import { Projection } from '../../../domain/entities/v2/Projection';
import { CreateProjectionInput } from '../../../app/dtos/v2/projections/CreateProjectionInput';
import { PrismaTransaction } from '../../../frameworks/database/PrismaTransaction';

export interface ProjectionRepository {
  findActiveByStudent(
    studentId: string,
    schoolId: string,
    schoolYear: string,
    tx?: PrismaTransaction
  ): Promise<Projection | null>;

  create(
    data: CreateProjectionInput,
    tx?: PrismaTransaction
  ): Promise<Projection>;
}