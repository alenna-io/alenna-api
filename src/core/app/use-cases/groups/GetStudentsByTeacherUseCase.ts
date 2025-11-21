import { IGroupRepository } from '../../../adapters_interface/repositories';
import { Group } from '../../../domain/entities';

export interface GetStudentsByTeacherParams {
  teacherId: string;
  schoolYearId: string;
  schoolId: string;
  includeDeleted?: boolean;
}

export class GetStudentsByTeacherUseCase {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(params: GetStudentsByTeacherParams): Promise<Group[]> {
    const { teacherId, schoolYearId, schoolId, includeDeleted = false } = params;
    return this.groupRepository.findByTeacherIdAndSchoolYearId(teacherId, schoolYearId, schoolId, includeDeleted);
  }
}

