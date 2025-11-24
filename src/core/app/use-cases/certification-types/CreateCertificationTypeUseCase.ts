import prisma from '../../../frameworks/database/prisma.client';
import { CertificationType } from '../../../domain/entities';
import type { CreateCertificationTypeInput } from '../../dtos';

export class CreateCertificationTypeUseCase {
  async execute(schoolId: string, input: CreateCertificationTypeInput): Promise<CertificationType> {
    const created = await prisma.certificationType.create({
      data: {
        name: input.name,
        description: input.description,
        isActive: input.isActive ?? true,
        schoolId,
      },
    });

    return new CertificationType(
      created.id,
      created.name,
      created.schoolId,
      created.description || undefined,
      created.isActive,
      created.createdAt,
      created.updatedAt,
    );
  }
}
