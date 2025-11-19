import type { ISchoolYearRepository } from '../../../adapters_interface/repositories';
import prisma from '../../../frameworks/database/prisma.client';

export class DeleteSchoolYearUseCase {
  constructor(private schoolYearRepository: ISchoolYearRepository) {}

  async execute(id: string): Promise<void> {
    // First, get the school year to check its name
    const schoolYear = await this.schoolYearRepository.findById(id);
    if (!schoolYear) {
      throw new Error('Año escolar no encontrado');
    }

    // Check if there are any projections linked to this school year
    const projectionCount = await prisma.projection.count({
      where: {
        schoolYear: schoolYear.name,
        deletedAt: null,
      },
    });

    if (projectionCount > 0) {
      throw new Error(`No se puede eliminar el año escolar "${schoolYear.name}" porque tiene ${projectionCount} ${projectionCount === 1 ? 'proyección' : 'proyecciones'} asociada${projectionCount === 1 ? '' : 's'}. Elimina las proyecciones primero.`);
    }

    // If no projections, proceed with soft delete
    await this.schoolYearRepository.delete(id);
  }
}

