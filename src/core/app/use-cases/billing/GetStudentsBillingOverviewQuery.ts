import { getStudentsWithBillingConfigInput } from '../../dtos'
import {
  IStudentRepository,
  IStudentScholarshipRepository,
  ITuitionTypeRepository,
  IRecurringExtraChargeRepository,
  IStudentBillingConfigRepository
} from '../../../adapters_interface/repositories'
import { StudentScholarship, RecurringExtraCharge, StudentBillingConfig } from '../../../domain/entities'

// Helper function to normalize text
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export type StudentBillingRow = {
  studentId: string
  fullName: string

  tuitionTypeId: string | null
  tuitionTypeName: string
  tuitionAmount: number

  scholarshipType: 'percentage' | 'fixed' | null
  scholarshipValue: number | null
  scholarshipDisplay: string

  recurringChargesTotal: number
  totalAmount: number

  requiresTaxableInvoice: boolean
}

export class GetStudentsBillingOverviewQuery {
  constructor(
    private readonly studentRepository: IStudentRepository,
    private readonly scholarshipRepository: IStudentScholarshipRepository,
    private readonly recurringExtraChargeRepository: IRecurringExtraChargeRepository,
    private readonly tuitionTypeRepository: ITuitionTypeRepository,
    private readonly studentBillingConfigRepository: IStudentBillingConfigRepository
  ) { }

  async execute(
    input: getStudentsWithBillingConfigInput,
    schoolId: string
  ): Promise<{
    students: StudentBillingRow[]
    total: number
    offset: number
    limit: number
  }> {
    const students = await this.studentRepository.findBySchoolId(schoolId)
    const scholarships = await this.scholarshipRepository.findBySchoolId(schoolId)
    const tuitionTypes = await this.tuitionTypeRepository.findBySchoolId(schoolId)
    const recurringExtraCharges =
      await this.recurringExtraChargeRepository.findActiveBySchoolId(schoolId)
    const studentBillingConfigs = await this.studentBillingConfigRepository.findBySchoolId(schoolId)

    const scholarshipByStudentId: Record<string, StudentScholarship> = {}
    scholarships.forEach(s => {
      scholarshipByStudentId[s.studentId] = s
    })

    const recurringChargesByStudentId: Record<string, RecurringExtraCharge[]> = {}
    recurringExtraCharges.forEach(c => {
      if (!recurringChargesByStudentId[c.studentId]) {
        recurringChargesByStudentId[c.studentId] = []
      }
      recurringChargesByStudentId[c.studentId].push(c)
    })

    const studentBillingConfigByStudentId: Record<string, StudentBillingConfig> = {}
    studentBillingConfigs.forEach(c => {
      studentBillingConfigByStudentId[c.studentId] = c
    })

    // SEARCH
    let filtered = students
    if (input.search) {
      const search = normalizeText(input.search)
      filtered = filtered.filter(s => {
        const fullName = normalizeText(`${s.firstName} ${s.lastName}`)
        return fullName.includes(search)
      })
    }

    // MAP TO READ MODEL
    let rows: StudentBillingRow[] = filtered.map(student => {
      const scholarship = scholarshipByStudentId[student.id] ?? null
      const charges = recurringChargesByStudentId[student.id] ?? []
      const studentBillingConfig = studentBillingConfigByStudentId[student.id] ?? null

      const tuitionType =
        tuitionTypes.find(t => t.id === scholarship?.tuitionTypeId) ??
        tuitionTypes[0] ??
        null

      const tuitionAmount = tuitionType?.baseAmount ?? 0

      let scholarshipDisplay = '—'
      let totalAmount = tuitionAmount

      if (scholarship?.scholarshipType === 'percentage') {
        totalAmount -= (tuitionAmount * (scholarship.scholarshipValue ?? 0)) / 100
        scholarshipDisplay = `${scholarship.scholarshipValue}%`
      }

      if (scholarship?.scholarshipType === 'fixed') {
        totalAmount -= scholarship.scholarshipValue ?? 0
        scholarshipDisplay = `$${(scholarship.scholarshipValue ?? 0).toFixed(2)}`
      }

      const recurringChargesTotal = charges.reduce(
        (sum, c) => sum + c.amount,
        0
      )

      totalAmount += recurringChargesTotal

      return {
        studentId: student.id,
        fullName: `${student.firstName} ${student.lastName}`,

        tuitionTypeId: tuitionType?.id ?? null,
        tuitionTypeName: tuitionType?.name ?? '—',
        tuitionAmount,

        scholarshipType: scholarship?.scholarshipType ?? null,
        scholarshipValue: scholarship?.scholarshipValue ?? null,
        scholarshipDisplay,

        recurringChargesTotal,
        totalAmount,

        requiresTaxableInvoice: studentBillingConfig?.requiresTaxableInvoice ?? false
      }
    })

    // FILTERS
    if (input.tuitionTypeId && input.tuitionTypeId !== 'all') {
      rows = rows.filter(r => r.tuitionTypeId === input.tuitionTypeId)
    }

    if (input.hasScholarship && input.hasScholarship !== 'all') {
      rows = rows.filter(r =>
        input.hasScholarship === 'yes'
          ? r.scholarshipValue !== null && r.scholarshipValue > 0
          : !r.scholarshipValue || r.scholarshipValue === 0
      )
    }

    // SORTING
    if (input.sortField) {
      rows.sort((a, b) => {
        const dir = input.sortDirection === 'desc' ? -1 : 1
        switch (input.sortField) {
          case 'name':
            return a.fullName.localeCompare(b.fullName) * dir
          case 'tuition':
            return (a.tuitionAmount - b.tuitionAmount) * dir
          case 'total':
            return (a.totalAmount - b.totalAmount) * dir
          case 'tuitionType':
            return a.tuitionTypeName.localeCompare(b.tuitionTypeName) * dir
          default:
            return 0
        }
      })
    }

    const total = rows.length
    const offset = input.offset ?? 0
    const limit = input.limit ?? 10

    return {
      students: rows.slice(offset, offset + limit),
      total,
      offset,
      limit
    }
  }
}
