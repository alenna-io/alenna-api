import { IGroupRepository } from '../../../adapters_interface/repositories';
import { Group } from '../../../domain/entities';

export interface GetGroupByIdParams {
  id: string;
  schoolId: string;
}

export class GetGroupByIdUseCase {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(params: GetGroupByIdParams): Promise<Group | null> {
    const { id, schoolId } = params;
    return this.groupRepository.findById(id, schoolId);
  }
}

