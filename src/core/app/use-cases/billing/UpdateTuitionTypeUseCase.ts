import { ITuitionTypeRepository } from '../../../adapters_interface/repositories';
import { TuitionType } from '../../../domain/entities';
import { UpdateTuitionTypeInput } from '../../dtos';

export class UpdateTuitionTypeUseCase {
  constructor(private tuitionTypeRepository: ITuitionTypeRepository) { }

  async execute(id: string, input: UpdateTuitionTypeInput, schoolId: string): Promise<TuitionType> {
    const existing = await this.tuitionTypeRepository.findById(id, schoolId);
    if (!existing) {
      throw new Error('Tuition type not found');
    }

    const updateData: {
      name?: string;
      baseAmount?: number;
      currency?: string;
      lateFeeType?: 'fixed' | 'percentage';
      lateFeeValue?: number;
      displayOrder?: number;
    } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.baseAmount !== undefined) updateData.baseAmount = input.baseAmount;
    if (input.currency !== undefined) updateData.currency = input.currency;
    if (input.lateFeeType !== undefined) updateData.lateFeeType = input.lateFeeType;
    if (input.lateFeeValue !== undefined) updateData.lateFeeValue = input.lateFeeValue;
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;

    return await this.tuitionTypeRepository.update(id, updateData as Partial<Omit<TuitionType, 'id' | 'schoolId' | 'createdAt' | 'updatedAt'>>, schoolId);
  }
}

