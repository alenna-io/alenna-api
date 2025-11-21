import { IGroupRepository } from '../../../adapters_interface/repositories';
import { GroupStudent } from '../../../domain/entities';

export interface AddStudentsToGroupParams {
  groupId: string;
  studentIds: string[];
  schoolId: string;
}

export class AddStudentsToGroupUseCase {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(params: AddStudentsToGroupParams): Promise<GroupStudent[]> {
    const { groupId, studentIds, schoolId } = params;
    return this.groupRepository.addStudentsToGroup(groupId, studentIds, schoolId);
  }
}

