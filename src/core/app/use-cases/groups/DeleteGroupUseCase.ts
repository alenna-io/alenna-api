import { IGroupRepository } from '../../../adapters_interface/repositories';

export interface DeleteGroupParams {
  id: string;
  schoolId: string;
}

export class DeleteGroupUseCase {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(params: DeleteGroupParams): Promise<void> {
    const { id, schoolId } = params;
    await this.groupRepository.delete(id, schoolId);
  }
}

