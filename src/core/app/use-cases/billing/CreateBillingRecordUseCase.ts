import { IBillingRecordRepository, ITuitionConfigRepository, IStudentScholarshipRepository, ITuitionTypeRepository, IStudentRepository, IStudentBillingConfigRepository } from '../../../adapters_interface/repositories';
import { BillingRecord } from '../../../domain/entities';
import { CreateBillingRecordInput } from '../../dtos';
import { randomUUID } from 'crypto';

export class CreateBillingRecordUseCase {
  constructor(
    private billingRecordRepository: IBillingRecordRepository,
    private tuitionConfigRepository: ITuitionConfigRepository,
    private studentScholarshipRepository: IStudentScholarshipRepository,
    private tuitionTypeRepository: ITuitionTypeRepository,
    private studentRepository: IStudentRepository,
    private studentBillingConfigRepository: IStudentBillingConfigRepository
  ) { }

  async execute(input: CreateBillingRecordInput, schoolId: string, createdBy: string): Promise<BillingRecord> {
    const student = await this.studentRepository.findById(input.studentId, schoolId);
    const studentBillingConfig = await this.studentBillingConfigRepository.findByStudentId(input.studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    const existingBill = await this.billingRecordRepository.findByMonthAndYear(
      input.studentId,
      input.billingMonth,
      input.billingYear,
      schoolId
    );

    if (existingBill) {
      throw new Error(`A bill already exists for this student for ${input.billingMonth}/${input.billingYear}`);
    }

    const tuitionConfig = await this.tuitionConfigRepository.findBySchoolId(schoolId);
    if (!tuitionConfig) {
      throw new Error('Tuition configuration not found. Please configure tuition settings first.');
    }

    const scholarship = await this.studentScholarshipRepository.findByStudentId(input.studentId, schoolId);

    // Get tuition type (from scholarship or default)
    let tuitionType = null;
    if (scholarship?.tuitionTypeId) {
      tuitionType = await this.tuitionTypeRepository.findById(scholarship.tuitionTypeId, schoolId);
    }

    // If no tuition type found, get the first/default one for the school
    if (!tuitionType) {
      const tuitionTypes = await this.tuitionTypeRepository.findBySchoolId(schoolId);
      if (tuitionTypes.length === 0) {
        throw new Error('No tuition types found. Please create at least one tuition type first.');
      }
      tuitionType = tuitionTypes[0]; // Use first/default one
    }

    // Create snapshot
    const tuitionTypeSnapshot = {
      tuitionTypeId: tuitionType.id,
      tuitionTypeName: tuitionType.name,
      baseAmount: tuitionType.baseAmount,
      lateFeeType: tuitionType.lateFeeType,
      lateFeeValue: tuitionType.lateFeeValue,
    };

    // Use tuition type's base amount (or override if provided in input)
    const effectiveTuitionAmount = input.baseAmount ?? tuitionType.baseAmount;

    // Calculate scholarship amount
    let scholarshipAmount = 0;
    if (scholarship) {
      scholarshipAmount = scholarship.calculateDiscount(effectiveTuitionAmount);
    }

    // Set taxable bill status based on student's scholarship config
    const taxableBillStatus = studentBillingConfig?.requiresTaxableInvoice ? 'required' : 'not_required';

    const billingRecord = BillingRecord.create({
      id: randomUUID(),
      studentId: input.studentId,
      schoolYearId: input.schoolYearId,
      billingMonth: input.billingMonth,
      billingYear: input.billingYear,
      tuitionTypeSnapshot,
      effectiveTuitionAmount,
      scholarshipAmount,
      billStatus: taxableBillStatus,
      dueDay: tuitionConfig.dueDay,
      createdBy,
    });

    return await this.billingRecordRepository.create(billingRecord);
  }
}
