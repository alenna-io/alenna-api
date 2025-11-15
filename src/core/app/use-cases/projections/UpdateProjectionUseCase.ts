import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { Projection } from '../../../domain/entities';
import { UpdateProjectionInput } from '../../dtos';

export class UpdateProjectionUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(id: string, data: UpdateProjectionInput, studentId: string): Promise<Projection> {
    // Get existing projection to use its update method
    const existing = await this.projectionRepository.findById(id, studentId);
    if (!existing) {
      throw new Error('Projection not found');
    }

    const updateData = {
      schoolYear: data.schoolYear,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      isActive: data.isActive,
      notes: data.notes,
    };

    return await this.projectionRepository.update(id, updateData, studentId);
  }
}

