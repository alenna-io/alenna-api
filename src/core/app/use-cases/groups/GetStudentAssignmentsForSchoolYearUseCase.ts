import { IGroupRepository } from '../../../adapters_interface/repositories';

export interface GetStudentAssignmentsForSchoolYearParams {
  schoolYearId: string;
  schoolId: string;
}

export class GetStudentAssignmentsForSchoolYearUseCase {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(params: GetStudentAssignmentsForSchoolYearParams): Promise<Array<{ studentId: string; groupId: string }>> {
    const { schoolYearId, schoolId } = params;
    return this.groupRepository.getStudentAssignmentsForSchoolYear(schoolYearId, schoolId);
  }
}
