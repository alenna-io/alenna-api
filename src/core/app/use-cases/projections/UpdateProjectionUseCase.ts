import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { Projection } from '../../../domain/entities';
import { UpdateProjectionInput } from '../../dtos';

export class UpdateProjectionUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(id: string, data: UpdateProjectionInput, studentId: string): Promise<Projection> {
    const updateData: Partial<Projection> = {};

    if (data.schoolYear !== undefined) updateData.schoolYear = data.schoolYear;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return await this.projectionRepository.update(id, updateData, studentId);
  }
}

