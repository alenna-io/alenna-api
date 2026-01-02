import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetBillingRecordsUseCase } from '../../../core/app/use-cases/billing/GetBillingRecordsUseCase';
import { createMockBillingRecordRepository } from '../../utils/mockRepositories';
import { BillingRecord } from '../../../core/domain/entities';

const TEST_CONSTANTS = {
  SCHOOL_ID: 'school-1',
};

// Helper to create a mock billing record
function createMockBillingRecord(overrides?: Partial<BillingRecord>): BillingRecord {
  const defaultRecord = {
    id: 'record-1',
    studentId: 'student-1',
    schoolYearId: 'school-year-1',
    billingMonth: 1,
    billingYear: 2025,
    effectiveTuitionAmount: 1000,
    scholarshipAmount: 0,
    discountAdjustments: [],
    extraCharges: [],
    lateFeeAmount: 0,
    finalAmount: 1000,
    paidAmount: 0,
    billStatus: 'required' as const,
    paymentStatus: 'pending' as const,
    dueDate: new Date('2025-01-05'),
    tuitionTypeSnapshot: {
      id: 'tuition-type-1',
      name: 'Standard',
      baseAmount: 1000,
      currency: 'USD',
      lateFeeType: 'fixed' as const,
      lateFeeValue: 50,
    },
  };

  return { ...defaultRecord, ...overrides } as BillingRecord;
}

describe('GetBillingRecordsUseCase', () => {
  let useCase: GetBillingRecordsUseCase;
  let mockBillingRecordRepository: ReturnType<typeof createMockBillingRecordRepository>;

  beforeEach(() => {
    mockBillingRecordRepository = createMockBillingRecordRepository();
    useCase = new GetBillingRecordsUseCase(mockBillingRecordRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return paginated records with month filter', async () => {
      // Arrange
      const mockRecords = [
        createMockBillingRecord({ id: 'record-1', billingMonth: 1, billingYear: 2025 }),
        createMockBillingRecord({ id: 'record-2', billingMonth: 1, billingYear: 2025 }),
      ];

      vi.mocked(mockBillingRecordRepository.findByFilters).mockResolvedValue({
        records: mockRecords,
        total: 2,
      });

      // Act
      const result = await useCase.execute(
        {
          billingMonth: 1,
          billingYear: 2025,
          offset: 0,
          limit: 10,
          sortDirection: 'asc',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result.records).toEqual(mockRecords);
      expect(result.total).toBe(2);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(10);
      expect(mockBillingRecordRepository.findByFilters).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        billingMonth: 1,
        billingYear: 2025,
        studentId: undefined,
        schoolYearId: undefined,
        paymentStatus: undefined,
        taxableBillStatus: undefined,
        billStatus: undefined,
        startDate: undefined,
        endDate: undefined,
        offset: 0,
        limit: 10,
        sortField: undefined,
        sortDirection: 'asc',
      });
    });

    it('should return paginated records with date range filter', async () => {
      // Arrange
      const mockRecords = [
        createMockBillingRecord({ id: 'record-1' }),
        createMockBillingRecord({ id: 'record-2' }),
        createMockBillingRecord({ id: 'record-3' }),
      ];

      vi.mocked(mockBillingRecordRepository.findByFilters).mockResolvedValue({
        records: mockRecords,
        total: 3,
      });

      // Act
      const result = await useCase.execute(
        {
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-31T23:59:59Z',
          offset: 0,
          limit: 10,
          sortDirection: 'asc',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result.records).toEqual(mockRecords);
      expect(result.total).toBe(3);
      expect(mockBillingRecordRepository.findByFilters).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        billingMonth: undefined,
        billingYear: undefined,
        studentId: undefined,
        schoolYearId: undefined,
        paymentStatus: undefined,
        taxableBillStatus: undefined,
        billStatus: undefined,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-31T23:59:59Z'),
        offset: 0,
        limit: 10,
        sortField: undefined,
        sortDirection: 'asc',
      });
    });

    it('should default to current month when no filters provided', async () => {
      // Arrange
      const mockRecords = [createMockBillingRecord()];

      vi.mocked(mockBillingRecordRepository.findByFilters).mockResolvedValue({
        records: mockRecords,
        total: 1,
      });

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Act
      const result = await useCase.execute({
        offset: 0,
        limit: 10,
        sortDirection: 'asc',
      }, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result.records).toEqual(mockRecords);
      expect(mockBillingRecordRepository.findByFilters).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        billingMonth: currentMonth,
        billingYear: currentYear,
        studentId: undefined,
        schoolYearId: undefined,
        paymentStatus: undefined,
        taxableBillStatus: undefined,
        billStatus: undefined,
        startDate: undefined,
        endDate: undefined,
        offset: 0,
        limit: 10,
        sortField: undefined,
        sortDirection: 'asc',
      });
    });

    it('should use default pagination values when not provided', async () => {
      // Arrange
      const mockRecords = [createMockBillingRecord()];

      vi.mocked(mockBillingRecordRepository.findByFilters).mockResolvedValue({
        records: mockRecords,
        total: 1,
      });

      // Act
      const result = await useCase.execute(
        {
          billingMonth: 1,
          billingYear: 2025,
          offset: 0,
          limit: 10,
          sortDirection: 'asc',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(10);
      expect(mockBillingRecordRepository.findByFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0,
          limit: 10,
        })
      );
    });

    it('should handle custom pagination', async () => {
      // Arrange
      const mockRecords = [
        createMockBillingRecord({ id: 'record-1' }),
        createMockBillingRecord({ id: 'record-2' }),
      ];

      vi.mocked(mockBillingRecordRepository.findByFilters).mockResolvedValue({
        records: mockRecords,
        total: 20,
      });

      // Act
      const result = await useCase.execute(
        {
          billingMonth: 1,
          billingYear: 2025,
          offset: 10,
          limit: 5,
          sortDirection: 'asc',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result.offset).toBe(10);
      expect(result.limit).toBe(5);
      expect(mockBillingRecordRepository.findByFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 10,
          limit: 5,
        })
      );
    });

    it('should handle sorting', async () => {
      // Arrange
      const mockRecords = [createMockBillingRecord()];

      vi.mocked(mockBillingRecordRepository.findByFilters).mockResolvedValue({
        records: mockRecords,
        total: 1,
      });

      // Act
      await useCase.execute(
        {
          billingMonth: 1,
          billingYear: 2025,
          sortField: 'studentName',
          sortDirection: 'desc',
          offset: 0,
          limit: 10,
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(mockBillingRecordRepository.findByFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          sortField: 'studentName',
          sortDirection: 'desc',
        })
      );
    });

    it('should handle payment status filter', async () => {
      // Arrange
      const mockRecords = [
        createMockBillingRecord({ id: 'record-1', paymentStatus: 'paid' }),
      ];

      vi.mocked(mockBillingRecordRepository.findByFilters).mockResolvedValue({
        records: mockRecords,
        total: 1,
      });

      // Act
      await useCase.execute(
        {
          billingMonth: 1,
          billingYear: 2025,
          paymentStatus: 'paid',
          offset: 0,
          limit: 10,
          sortDirection: 'asc',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(mockBillingRecordRepository.findByFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: 'paid',
        })
      );
    });

    it('should handle student filter', async () => {
      // Arrange
      const mockRecords = [createMockBillingRecord({ studentId: 'student-1' })];

      vi.mocked(mockBillingRecordRepository.findByFilters).mockResolvedValue({
        records: mockRecords,
        total: 1,
      });

      // Act
      await useCase.execute(
        {
          billingMonth: 1,
          billingYear: 2025,
          studentId: 'student-1',
          offset: 0,
          limit: 10,
          sortDirection: 'asc',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(mockBillingRecordRepository.findByFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'student-1',
        })
      );
    });

    it('should handle all filters together', async () => {
      // Arrange
      const mockRecords = [createMockBillingRecord()];

      vi.mocked(mockBillingRecordRepository.findByFilters).mockResolvedValue({
        records: mockRecords,
        total: 1,
      });

      // Act
      await useCase.execute(
        {
          billingMonth: 2,
          billingYear: 2025,
          paymentStatus: 'pending',
          studentId: 'student-1',
          schoolYearId: 'school-year-1',
          offset: 5,
          limit: 20,
          sortField: 'month',
          sortDirection: 'desc',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(mockBillingRecordRepository.findByFilters).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        billingMonth: 2,
        billingYear: 2025,
        studentId: 'student-1',
        schoolYearId: 'school-year-1',
        paymentStatus: 'pending',
        taxableBillStatus: undefined,
        billStatus: undefined,
        startDate: undefined,
        endDate: undefined,
        offset: 5,
        limit: 20,
        sortField: 'month',
        sortDirection: 'desc',
      });
    });

    it('should return empty results when no records found', async () => {
      // Arrange
      vi.mocked(mockBillingRecordRepository.findByFilters).mockResolvedValue({
        records: [],
        total: 0,
      });

      // Act
      const result = await useCase.execute(
        {
          billingMonth: 1,
          billingYear: 2025,
          offset: 0,
          limit: 10,
          sortDirection: 'asc',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result.records).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(10);
    });
  });
});

