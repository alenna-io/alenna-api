import { IGroupRepository } from '../../../adapters_interface/repositories';
import { GroupStudent } from '../../../domain/entities';

export interface GetGroupStudentsParams {
  groupId: string;
  schoolId: string;
  includeDeleted?: boolean;
}

export class GetGroupStudentsUseCase {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(params: GetGroupStudentsParams): Promise<GroupStudent[]> {
    const { groupId, schoolId, includeDeleted = false } = params;
    return this.groupRepository.getGroupStudents(groupId, schoolId, includeDeleted);
  }
}

