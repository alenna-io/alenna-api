import { SubSubjectRepository } from '../../../../adapters_interface/repositories/v2';
import { SubSubject } from '../../../../domain/entities/v2/SubSubject';
import { SubSubjectMapper } from '../../mappers/v2/SubSubjectMapper';
import prisma from '../../prisma.client';
import { PrismaTransaction } from '../../PrismaTransaction';

export class PrismaSubSubjectRepository implements SubSubjectRepository {
  async findById(id: string, tx: PrismaTransaction = prisma): Promise<SubSubject | null> {
    const subSubject = await tx.subSubject.findUnique({
      where: { id },
    });
    return subSubject ? SubSubjectMapper.toDomain(subSubject) : null;
  }

  async findManyByIds(ids: string[], tx: PrismaTransaction = prisma): Promise<SubSubject[]> {
    const subSubjects = await tx.subSubject.findMany({
      where: { id: { in: ids } },
    });
    return subSubjects.map(SubSubjectMapper.toDomain);
  }
}