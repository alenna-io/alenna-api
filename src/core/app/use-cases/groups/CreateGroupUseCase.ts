import { IGroupRepository } from '../../../adapters_interface/repositories';
import { Group, GroupStudent } from '../../../domain/entities';

export interface CreateGroupParams {
  teacherId: string;
  schoolYearId: string;
  schoolId: string;
  name?: string | null;
  studentIds?: string[]; // Optional: add students immediately
}

export class CreateGroupUseCase {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(params: CreateGroupParams): Promise<{ group: Group; groupStudents: GroupStudent[] }> {
    const { teacherId, schoolYearId, schoolId, name, studentIds = [] } = params;
    
    // Create the group
    const group = await this.groupRepository.create(teacherId, schoolYearId, schoolId, name);
    
    // Add students to the group if provided
    const groupStudents: GroupStudent[] = [];
    if (studentIds.length > 0) {
      const addedStudents = await this.groupRepository.addStudentsToGroup(group.id, studentIds, schoolId);
      groupStudents.push(...addedStudents);
    }
    
    return { group, groupStudents };
  }
}

