import { StudentBillingConfig } from '../../../domain/entities';
import { IStudentBillingConfigRepository } from '../../../adapters_interface/repositories';

export class GetBillingConfigByStudentUseCase {
  constructor(
    private studentBillingConfigRepository: IStudentBillingConfigRepository
  ) { }

  async execute(studentId: string): Promise<StudentBillingConfig | null> {
    return await this.studentBillingConfigRepository.findByStudentId(studentId);
  }
}