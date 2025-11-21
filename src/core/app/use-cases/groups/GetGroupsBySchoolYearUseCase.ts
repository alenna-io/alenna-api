import { IGroupRepository } from '../../../adapters_interface/repositories';
import { Group } from '../../../domain/entities';

export interface GetGroupsBySchoolYearParams {
  schoolYearId: string;
  schoolId: string;
  includeDeleted?: boolean;
}

export class GetGroupsBySchoolYearUseCase {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(params: GetGroupsBySchoolYearParams): Promise<Group[]> {
    const { schoolYearId, schoolId, includeDeleted = false } = params;
    return this.groupRepository.findBySchoolYearId(schoolYearId, schoolId, includeDeleted);
  }
}

