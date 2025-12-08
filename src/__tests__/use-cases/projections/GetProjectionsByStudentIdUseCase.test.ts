import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetProjectionsByStudentIdUseCase } from '../../../core/app/use-cases/projections/GetProjectionsByStudentIdUseCase';
import { createMockProjectionRepository } from '../../utils/mockRepositories';
import { Projection } from '../../../core/domain/entities';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      constructor() {
        return mockPrismaInstance;
      }
    },
  };
});

describe('GetProjectionsByStudentIdUseCase', () => {
  let useCase: GetProjectionsByStudentIdUseCase;
  let mockRepository: ReturnType<typeof createMockProjectionRepository>;
  let mockPrisma: any;

  beforeEach(() => {
    mockRepository = createMockProjectionRepository();
    useCase = new GetProjectionsByStudentIdUseCase(mockRepository);
    mockPrisma = mockPrismaInstance;
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should return projections for student', async () => {
      const projections = [
        Projection.create({
          id: 'projection-1',
          studentId: TEST_CONSTANTS.STUDENT_ID,
          schoolYear: '2024-2025',
          startDate: new Date(),
          endDate: new Date(),
        }),
      ];

      vi.mocked(mockRepository.findByStudentId).mockResolvedValue(projections);

      const result = await useCase.execute(TEST_CONSTANTS.STUDENT_ID);

      expect(result).toEqual(projections);
      expect(mockRepository.findByStudentId).toHaveBeenCalledWith(TEST_CONSTANTS.STUDENT_ID);
    });

    it('should allow parent to view their child projections', async () => {
      const projections = [
        Projection.create({
          id: 'projection-1',
          studentId: TEST_CONSTANTS.STUDENT_ID,
          schoolYear: '2024-2025',
          startDate: new Date(),
          endDate: new Date(),
        }),
      ];

      const parentUser = {
        id: 'parent-user-id',
        userRoles: [
          { role: { name: 'PARENT' } },
        ],
        userStudents: [
          { studentId: TEST_CONSTANTS.STUDENT_ID },
        ],
        student: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(parentUser);
      vi.mocked(mockRepository.findByStudentId).mockResolvedValue(projections);

      const result = await useCase.execute(TEST_CONSTANTS.STUDENT_ID, 'parent-user-id');

      expect(result).toEqual(projections);
    });

    it('should throw error when parent tries to view unrelated student projections', async () => {
      const parentUser = {
        id: 'parent-user-id',
        userRoles: [
          { role: { name: 'PARENT' } },
        ],
        userStudents: [
          { studentId: 'different-student-id' },
        ],
        student: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(parentUser);

      await expect(
        useCase.execute(TEST_CONSTANTS.STUDENT_ID, 'parent-user-id')
      ).rejects.toThrow('No tienes permiso para ver las proyecciones de este estudiante');
    });

    it('should allow student to view their own projections', async () => {
      const projections = [
        Projection.create({
          id: 'projection-1',
          studentId: TEST_CONSTANTS.STUDENT_ID,
          schoolYear: '2024-2025',
          startDate: new Date(),
          endDate: new Date(),
        }),
      ];

      const studentUser = {
        id: 'student-user-id',
        userRoles: [
          { role: { name: 'STUDENT' } },
        ],
        userStudents: [],
        student: {
          id: TEST_CONSTANTS.STUDENT_ID,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(studentUser);
      vi.mocked(mockRepository.findByStudentId).mockResolvedValue(projections);

      const result = await useCase.execute(TEST_CONSTANTS.STUDENT_ID, 'student-user-id');

      expect(result).toEqual(projections);
    });

    it('should throw error when student tries to view another student projections', async () => {
      const studentUser = {
        id: 'student-user-id',
        userRoles: [
          { role: { name: 'STUDENT' } },
        ],
        userStudents: [],
        student: {
          id: 'different-student-id',
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(studentUser);

      await expect(
        useCase.execute(TEST_CONSTANTS.STUDENT_ID, 'student-user-id')
      ).rejects.toThrow('No tienes permiso para ver las proyecciones de este estudiante');
    });

    it('should allow teacher to view any student projections', async () => {
      const projections = [
        Projection.create({
          id: 'projection-1',
          studentId: TEST_CONSTANTS.STUDENT_ID,
          schoolYear: '2024-2025',
          startDate: new Date(),
          endDate: new Date(),
        }),
      ];

      const teacherUser = {
        id: 'teacher-user-id',
        userRoles: [
          { role: { name: 'TEACHER' } },
        ],
        userStudents: [],
        student: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(teacherUser);
      vi.mocked(mockRepository.findByStudentId).mockResolvedValue(projections);

      const result = await useCase.execute(TEST_CONSTANTS.STUDENT_ID, 'teacher-user-id');

      expect(result).toEqual(projections);
    });

    it('should return empty array when no projections exist', async () => {
      vi.mocked(mockRepository.findByStudentId).mockResolvedValue([]);

      const result = await useCase.execute(TEST_CONSTANTS.STUDENT_ID);

      expect(result).toEqual([]);
    });
  });
});

