import { IBillingRecordRepository } from '../../../adapters_interface/repositories';
import { GetBillingRecordsInput } from '../../dtos';
import prisma from '../../../frameworks/database/prisma.client';

// Helper function to normalize text: remove accents and convert to lowercase
function normalizeText(text: string): string {
  return text
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim();
}

export class GetBillingRecordsUseCase {
  constructor(private billingRecordRepository: IBillingRecordRepository) {}

  async execute(input: GetBillingRecordsInput, schoolId: string): Promise<{
    records: any[];
    total: number;
    offset: number;
    limit: number;
  }> {
    // Apply default filters: if no filters provided, use current month
    const now = new Date();
    let billingMonth = input.billingMonth;
    let billingYear = input.billingYear;
    let startDate = input.startDate ? new Date(input.startDate) : undefined;
    let endDate = input.endDate ? new Date(input.endDate) : undefined;

    // If no filters at all, default to current month
    if (!billingMonth && !billingYear && !startDate && !endDate) {
      billingMonth = now.getMonth() + 1;
      billingYear = now.getFullYear();
    }

    // Handle accent-insensitive student name search
    let studentIdsFromSearch: string[] | undefined;
    if (input.studentName) {
      const normalizedSearch = normalizeText(input.studentName);
      
      // Fetch all students for this school
      const allStudents = await prisma.student.findMany({
        where: {
          schoolId,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Filter with accent-insensitive search
      const matchingStudents = allStudents.filter((student) => {
        const firstName = normalizeText(student.user.firstName || '');
        const lastName = normalizeText(student.user.lastName || '');
        const fullName = normalizeText(`${student.user.firstName} ${student.user.lastName}`);
        
        return (
          firstName.includes(normalizedSearch) ||
          lastName.includes(normalizedSearch) ||
          fullName.includes(normalizedSearch)
        );
      });

      studentIdsFromSearch = matchingStudents.map(s => s.id);
      
      // If no students match, return empty result
      if (studentIdsFromSearch.length === 0) {
        return {
          records: [],
          total: 0,
          offset: input.offset || 0,
          limit: input.limit || 10,
        };
      }
    }

    const filters: any = {
      schoolId,
      studentId: input.studentId,
      studentIds: studentIdsFromSearch, // Pass array of matching student IDs
      schoolYearId: input.schoolYearId,
      billingMonth,
      billingYear,
      paymentStatus: input.paymentStatus,
      taxableBillStatus: input.taxableBillStatus,
      billStatus: input.billStatus, // For backward compatibility
      startDate,
      endDate,
      offset: input.offset || 0,
      limit: input.limit || 10,
      sortField: input.sortField,
      sortDirection: input.sortDirection || 'asc',
    };

    const result = await this.billingRecordRepository.findByFilters(filters);

    return {
      records: result.records,
      total: result.total,
      offset: input.offset || 0,
      limit: input.limit || 10,
    };
  }
}
