import { PrismaTransaction } from '../../../infrastructure/database/PrismaTransaction';
import { Prisma } from '@prisma/client';

export interface IStudentRepository {
  findById(id: string, schoolId: string, tx?: PrismaTransaction): Promise<Prisma.StudentGetPayload<{}> | null>;
  findEnrolledWithoutOpenProjectionBySchoolId(schoolId: string, tx?: PrismaTransaction): Promise<Prisma.StudentGetPayload<{}>[]>;
} 