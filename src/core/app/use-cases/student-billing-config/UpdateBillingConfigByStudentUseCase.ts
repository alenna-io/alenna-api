import { StudentBillingConfig } from '../../../domain/entities';
import { IStudentBillingConfigRepository } from '../../../adapters_interface/repositories';
import { UpdateStudentBillingConfigInput } from '../../dtos/StudentBillingConfigDTO';

export class UpdateBillingConfigByStudentUseCase {
  constructor(
    private studentBillingConfigRepository: IStudentBillingConfigRepository
  ) { }

  async execute(id: string, input: UpdateStudentBillingConfigInput): Promise<StudentBillingConfig> {
    const existing = await this.studentBillingConfigRepository.findById(id);
    if (!existing) {
      throw new Error('Student billing config not found');
    }

    if (id !== existing.id) {
      throw new Error('Student billing config ID mismatch');
    }

    const updatedConfig = existing.update(input);
    return await this.studentBillingConfigRepository.update(id, updatedConfig);
  }
}