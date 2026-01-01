import { IBillingRecordRepository, ITuitionConfigRepository, IStudentScholarshipRepository, ITuitionTypeRepository, IStudentRepository } from '../../../adapters_interface/repositories';
import { BillingRecord } from '../../../domain/entities';
import { BulkCreateBillingRecordsInput } from '../../dtos';
import { randomUUID } from 'crypto';

export class BulkCreateBillingRecordsUseCase {
  constructor(
    private billingRecordRepository: IBillingRecordRepository,
    private tuitionConfigRepository: ITuitionConfigRepository,
    private studentScholarshipRepository: IStudentScholarshipRepository,
    private tuitionTypeRepository: ITuitionTypeRepository,
    private studentRepository: IStudentRepository
  ) { }

  async execute(input: BulkCreateBillingRecordsInput, schoolId: string, createdBy: string): Promise<BillingRecord[]> {
    const tuitionConfig = await this.tuitionConfigRepository.findBySchoolId(schoolId);
    if (!tuitionConfig) {
      throw new Error('Tuition configuration not found. Please configure tuition settings first.');
    }

    // Get all tuition types for the school (for fallback)
    const tuitionTypes = await this.tuitionTypeRepository.findBySchoolId(schoolId);
    if (tuitionTypes.length === 0) {
      throw new Error('No tuition types found. Please create at least one tuition type first.');
    }
    const defaultTuitionType = tuitionTypes[0];

    let students;
    if (input.studentIds && input.studentIds.length > 0) {
      // Get students by IDs
      students = await Promise.all(
        input.studentIds.map(id => this.studentRepository.findById(id, schoolId))
      );
      students = students.filter(s => s !== null) as any[];
    } else {
      // Get all students for the school
      students = await this.studentRepository.findBySchoolId(schoolId);
    }

    const billingRecords: BillingRecord[] = [];

    for (const student of students) {
      const studentId = (student as any).id || student;
      const existingBill = await this.billingRecordRepository.findByMonthAndYear(
        student.id,
        input.billingMonth,
        input.billingYear,
        schoolId
      );

      if (existingBill) {
        continue;
      }

      const scholarship = await this.studentScholarshipRepository.findByStudentId(student.id, schoolId);
      
      // Get tuition type (from scholarship or default)
      let tuitionType = defaultTuitionType;
      if (scholarship?.tuitionTypeId) {
        const foundType = await this.tuitionTypeRepository.findById(scholarship.tuitionTypeId, schoolId);
        if (foundType) {
          tuitionType = foundType;
        }
      }

      // Create snapshot
      const tuitionTypeSnapshot = {
        tuitionTypeId: tuitionType.id,
        tuitionTypeName: tuitionType.name,
        baseAmount: tuitionType.baseAmount,
        lateFeeType: tuitionType.lateFeeType,
        lateFeeValue: tuitionType.lateFeeValue,
      };

      const effectiveTuitionAmount = tuitionType.baseAmount;
      let scholarshipAmount = 0;
      if (scholarship) {
        scholarshipAmount = scholarship.calculateDiscount(effectiveTuitionAmount);
      }

      // Set taxable bill status based on student's scholarship config
      const taxableBillStatus = scholarship?.taxableBillRequired ? 'required' : 'not_required';

      const billingRecord = BillingRecord.create({
        id: randomUUID(),
        studentId: studentId,
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

      billingRecords.push(billingRecord);
    }

    if (billingRecords.length === 0) {
      return [];
    }

    return await this.billingRecordRepository.createMany(billingRecords);
  }
}
