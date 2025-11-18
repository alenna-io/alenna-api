import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { Projection } from '../../../domain/entities';
import { CreateProjectionInput } from '../../dtos';
import { randomUUID } from 'crypto';

export class CreateProjectionUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(data: CreateProjectionInput, studentId: string): Promise<Projection> {
    // Check if there's already an active projection for this student
    const activeProjection = await this.projectionRepository.findActiveByStudentId(studentId);
    if (activeProjection) {
      throw new Error('El estudiante ya tiene una proyección activa. Debe desactivar o eliminar la proyección existente antes de crear una nueva.');
    }

    // Check if there's already a projection for this student and school year
    const existingProjection = await this.projectionRepository.findByStudentIdAndSchoolYear(studentId, data.schoolYear);
    if (existingProjection) {
      throw new Error(`Ya existe una proyección para este estudiante en el año escolar ${data.schoolYear}. Solo se permite una proyección por estudiante por año escolar.`);
    }

    const projection = Projection.create({
      id: randomUUID(),
      studentId,
      schoolYear: data.schoolYear,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive,
      notes: data.notes,
    });

    return await this.projectionRepository.create(projection);
  }
}

