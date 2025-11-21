import { IGroupRepository } from '../../../adapters_interface/repositories';

export interface RemoveStudentFromGroupParams {
  groupId: string;
  studentId: string;
  schoolId: string;
}

export class RemoveStudentFromGroupUseCase {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(params: RemoveStudentFromGroupParams): Promise<void> {
    const { groupId, studentId, schoolId } = params;
    await this.groupRepository.removeStudentFromGroup(groupId, studentId, schoolId);
  }
}

