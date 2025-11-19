import prisma from '../../../frameworks/database/prisma.client';
import { CertificationType } from '../../../domain/entities';

export class GetCertificationTypesUseCase {
  async execute(schoolId: string): Promise<CertificationType[]> {
    const certificationTypes = await prisma.certificationType.findMany({
      where: {
        schoolId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return certificationTypes.map(ct => new CertificationType(
      ct.id,
      ct.name,
      ct.schoolId,
      ct.description || undefined,
      ct.isActive,
      ct.createdAt,
      ct.updatedAt
    ));
  }
}

