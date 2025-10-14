import { IProjectionRepository } from '../../../adapters_interface/repositories';
import { Projection } from '../../../domain/entities';
import { CreateProjectionInput } from '../../dtos';
import { randomUUID } from 'crypto';

export class CreateProjectionUseCase {
  constructor(private projectionRepository: IProjectionRepository) {}

  async execute(data: CreateProjectionInput, studentId: string): Promise<Projection> {
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

