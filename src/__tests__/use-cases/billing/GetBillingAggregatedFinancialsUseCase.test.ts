import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetBillingAggregatedFinancialsUseCase } from '../../../core/app/use-cases/billing/GetBillingAggregatedFinancialsUseCase';
import { createMockBillingRecordRepository } from '../../utils/mockRepositories';

const TEST_CONSTANTS = {
  SCHOOL_ID: 'school-1',
};

describe('GetBillingAggregatedFinancialsUseCase', () => {
  let useCase: GetBillingAggregatedFinancialsUseCase;
  let mockBillingRecordRepository: ReturnType<typeof createMockBillingRecordRepository>;

  beforeEach(() => {
    mockBillingRecordRepository = createMockBillingRecordRepository();
    useCase = new GetBillingAggregatedFinancialsUseCase(mockBillingRecordRepository);
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return aggregated financials with month filter', async () => {
      // Arrange
      const expectedMetrics = {
        totalIncome: 5000,
        expectedIncome: 10000,
        missingIncome: 5000,
        totalStudentsPaid: 5,
        totalStudentsNotPaid: 5,
        lateFeesApplied: 200,
      };

      vi.mocked(mockBillingRecordRepository.getMetrics).mockResolvedValue(expectedMetrics);

      // Act
      const result = await useCase.execute(
        {
          billingMonth: 1,
          billingYear: 2025,
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result).toEqual(expectedMetrics);
      expect(mockBillingRecordRepository.getMetrics).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        billingMonth: 1,
        billingYear: 2025,
        studentId: undefined,
        schoolYearId: undefined,
        paymentStatus: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should return aggregated financials with date range filter', async () => {
      // Arrange
      const expectedMetrics = {
        totalIncome: 3000,
        expectedIncome: 6000,
        missingIncome: 3000,
        totalStudentsPaid: 3,
        totalStudentsNotPaid: 3,
        lateFeesApplied: 100,
      };

      vi.mocked(mockBillingRecordRepository.getMetrics).mockResolvedValue(expectedMetrics);

      // Act
      const result = await useCase.execute(
        {
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-31T23:59:59Z',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result).toEqual(expectedMetrics);
      expect(mockBillingRecordRepository.getMetrics).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        billingMonth: undefined,
        billingYear: undefined,
        studentId: undefined,
        schoolYearId: undefined,
        paymentStatus: undefined,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-31T23:59:59Z'),
      });
    });

    it('should return aggregated financials with payment status filter', async () => {
      // Arrange
      const expectedMetrics = {
        totalIncome: 2000,
        expectedIncome: 5000,
        missingIncome: 3000,
        totalStudentsPaid: 2,
        totalStudentsNotPaid: 3,
        lateFeesApplied: 150,
      };

      vi.mocked(mockBillingRecordRepository.getMetrics).mockResolvedValue(expectedMetrics);

      // Act
      const result = await useCase.execute(
        {
          billingMonth: 1,
          billingYear: 2025,
          paymentStatus: 'paid',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result).toEqual(expectedMetrics);
      expect(mockBillingRecordRepository.getMetrics).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        billingMonth: 1,
        billingYear: 2025,
        studentId: undefined,
        schoolYearId: undefined,
        paymentStatus: 'paid',
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should return aggregated financials with student filter', async () => {
      // Arrange
      const expectedMetrics = {
        totalIncome: 1000,
        expectedIncome: 1000,
        missingIncome: 0,
        totalStudentsPaid: 1,
        totalStudentsNotPaid: 0,
        lateFeesApplied: 0,
      };

      vi.mocked(mockBillingRecordRepository.getMetrics).mockResolvedValue(expectedMetrics);

      // Act
      const result = await useCase.execute(
        {
          billingMonth: 1,
          billingYear: 2025,
          studentId: 'student-1',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result).toEqual(expectedMetrics);
      expect(mockBillingRecordRepository.getMetrics).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        billingMonth: 1,
        billingYear: 2025,
        studentId: 'student-1',
        schoolYearId: undefined,
        paymentStatus: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should default to current month when no filters provided', async () => {
      // Arrange
      const expectedMetrics = {
        totalIncome: 4000,
        expectedIncome: 8000,
        missingIncome: 4000,
        totalStudentsPaid: 4,
        totalStudentsNotPaid: 4,
        lateFeesApplied: 180,
      };

      vi.mocked(mockBillingRecordRepository.getMetrics).mockResolvedValue(expectedMetrics);

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Act
      const result = await useCase.execute({}, TEST_CONSTANTS.SCHOOL_ID);

      // Assert
      expect(result).toEqual(expectedMetrics);
      expect(mockBillingRecordRepository.getMetrics).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        billingMonth: currentMonth,
        billingYear: currentYear,
        studentId: undefined,
        schoolYearId: undefined,
        paymentStatus: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should prioritize month filter over date range', async () => {
      // Arrange
      const expectedMetrics = {
        totalIncome: 2500,
        expectedIncome: 5000,
        missingIncome: 2500,
        totalStudentsPaid: 2,
        totalStudentsNotPaid: 3,
        lateFeesApplied: 120,
      };

      vi.mocked(mockBillingRecordRepository.getMetrics).mockResolvedValue(expectedMetrics);

      // Act
      const result = await useCase.execute(
        {
          billingMonth: 2,
          billingYear: 2025,
          startDate: '2025-01-01T00:00:00Z',
          endDate: '2025-01-31T23:59:59Z',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result).toEqual(expectedMetrics);
      // Month filter should be used, date range should be ignored
      expect(mockBillingRecordRepository.getMetrics).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        billingMonth: 2,
        billingYear: 2025,
        studentId: undefined,
        schoolYearId: undefined,
        paymentStatus: undefined,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-01-31T23:59:59Z'),
      });
    });

    it('should handle all filters together', async () => {
      // Arrange
      const expectedMetrics = {
        totalIncome: 1500,
        expectedIncome: 3000,
        missingIncome: 1500,
        totalStudentsPaid: 1,
        totalStudentsNotPaid: 2,
        lateFeesApplied: 50,
      };

      vi.mocked(mockBillingRecordRepository.getMetrics).mockResolvedValue(expectedMetrics);

      // Act
      const result = await useCase.execute(
        {
          billingMonth: 3,
          billingYear: 2025,
          paymentStatus: 'pending',
          studentId: 'student-1',
          schoolYearId: 'school-year-1',
        },
        TEST_CONSTANTS.SCHOOL_ID
      );

      // Assert
      expect(result).toEqual(expectedMetrics);
      expect(mockBillingRecordRepository.getMetrics).toHaveBeenCalledWith({
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        billingMonth: 3,
        billingYear: 2025,
        studentId: 'student-1',
        schoolYearId: 'school-year-1',
        paymentStatus: 'pending',
        startDate: undefined,
        endDate: undefined,
      });
    });
  });
});

