import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetUserInfoUseCase } from '../../../core/app/use-cases/auth/GetUserInfoUseCase';
import { TEST_CONSTANTS } from '../../utils/testHelpers';

// Mock Prisma Client
const { mockPrismaInstance } = vi.hoisted(() => {
  return {
    mockPrismaInstance: {
      user: {
        findUnique: vi.fn(),
      },
      student: {
        findFirst: vi.fn(),
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

// Mock CheckPermissionUseCase
const { mockCheckPermissionInstance } = vi.hoisted(() => {
  return {
    mockCheckPermissionInstance: {
      getUserPermissions: vi.fn(),
      getUserModules: vi.fn(),
    },
  };
});

vi.mock('../../../core/app/use-cases/auth/CheckPermissionUseCase', () => {
  return {
    CheckPermissionUseCase: class {
      constructor() {
        return mockCheckPermissionInstance;
      }
    },
  };
});

describe('GetUserInfoUseCase', () => {
  let useCase: GetUserInfoUseCase;
  let mockPrisma: any;
  let mockCheckPermission: any;
  let consoleInfoSpy: any;

  beforeEach(() => {
    useCase = new GetUserInfoUseCase();
    mockPrisma = mockPrismaInstance;
    mockCheckPermission = mockCheckPermissionInstance;
    // Suppress console.info for cleaner test output
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
  });

  describe('execute', () => {
    it('should return user info with roles and permissions', async () => {
      // Arrange
      const mockUser = {
        id: TEST_CONSTANTS.USER_ID,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        language: 'en',
        createdPassword: false,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        school: {
          id: TEST_CONSTANTS.SCHOOL_ID,
          name: 'Test School',
        },
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'TEACHER',
              displayName: 'Teacher',
            },
          },
        ],
        student: null,
      };

      const mockPermissions = ['students.read', 'students.create'];
      const mockModules = [
        {
          id: 'module-1',
          key: 'students',
          name: 'Students',
          description: 'Student management',
          displayOrder: 1,
          actions: ['read', 'create'],
        },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(mockCheckPermission.getUserPermissions).mockResolvedValue(mockPermissions);
      vi.mocked(mockCheckPermission.getUserModules).mockResolvedValue(mockModules);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result.id).toBe(TEST_CONSTANTS.USER_ID);
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('Test');
      expect(result.lastName).toBe('User');
      expect(result.fullName).toBe('Test User');
      expect(result.schoolId).toBe(TEST_CONSTANTS.SCHOOL_ID);
      expect(result.schoolName).toBe('Test School');
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].name).toBe('TEACHER');
      expect(result.permissions).toEqual(mockPermissions);
      expect(result.modules).toEqual(mockModules);
      expect(result.studentProfile).toBeUndefined();
    });

    it('should return user info with student profile when user is student', async () => {
      // Arrange
      const mockUser = {
        id: TEST_CONSTANTS.USER_ID,
        email: 'student@example.com',
        firstName: 'Student',
        lastName: 'Name',
        language: 'en',
        createdPassword: false,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        school: {
          id: TEST_CONSTANTS.SCHOOL_ID,
          name: 'Test School',
        },
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'STUDENT',
              displayName: 'Student',
            },
          },
        ],
        student: {
          id: 'student-1',
          birthDate: new Date('2010-01-01'),
          graduationDate: new Date('2028-06-01'),
          isLeveled: false,
          certificationType: {
            name: 'Test Certification',
          },
          user: {
            firstName: 'Student',
            lastName: 'Name',
            phone: '123-456-7890',
            streetAddress: '123 Main St',
            city: 'City',
            state: 'State',
            country: 'Country',
            zipCode: '12345',
          },
          userStudents: [
            {
              user: {
                id: 'parent-1',
                firstName: 'Parent',
                lastName: 'Name',
                userRoles: [
                  {
                    role: {
                      name: 'PARENT',
                    },
                  },
                ],
              },
            },
          ],
        },
      };

      const mockPermissions = ['students.readOwn'];
      const mockModules: Array<{
        id: string;
        key: string;
        name: string;
        description?: string;
        displayOrder: number;
        actions: string[];
      }> = [];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(mockCheckPermission.getUserPermissions).mockResolvedValue(mockPermissions);
      vi.mocked(mockCheckPermission.getUserModules).mockResolvedValue(mockModules);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result.studentProfile).toBeDefined();
      expect(result.studentProfile?.id).toBe('student-1');
      expect(result.studentProfile?.firstName).toBe('Student');
      expect(result.studentProfile?.lastName).toBe('Name');
      expect(result.studentProfile?.certificationType).toBe('Test Certification');
      expect(result.studentProfile?.parents).toHaveLength(1);
      expect(result.studentProfile?.parents[0].name).toBe('Parent Name');
    });

    it('should resolve student profile via fallback when user has STUDENT role but no direct student link', async () => {
      // Arrange
      const mockUser = {
        id: TEST_CONSTANTS.USER_ID,
        email: 'student@example.com',
        firstName: 'Student',
        lastName: 'Name',
        language: 'en',
        createdPassword: false,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        school: {
          id: TEST_CONSTANTS.SCHOOL_ID,
          name: 'Test School',
        },
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'STUDENT',
              displayName: 'Student',
            },
          },
        ],
        student: null,
      };

      const mockStudent = {
        id: 'student-1',
        birthDate: new Date('2010-01-01'),
        graduationDate: new Date('2028-06-01'),
        isLeveled: false,
        certificationType: {
          name: 'Test Certification',
        },
        user: {
          firstName: 'Student',
          lastName: 'Name',
        },
        userStudents: [],
      };

      const mockPermissions = ['students.readOwn'];
      const mockModules: Array<{
        id: string;
        key: string;
        name: string;
        description?: string;
        displayOrder: number;
        actions: string[];
      }> = [];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.student.findFirst.mockResolvedValue(mockStudent);
      vi.mocked(mockCheckPermission.getUserPermissions).mockResolvedValue(mockPermissions);
      vi.mocked(mockCheckPermission.getUserModules).mockResolvedValue(mockModules);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result.studentProfile).toBeDefined();
      expect(result.studentProfile?.id).toBe('student-1');
      expect(mockPrisma.student.findFirst).toHaveBeenCalledWith({
        where: {
          userId: TEST_CONSTANTS.USER_ID,
          deletedAt: null,
        },
        include: expect.any(Object),
      });
    });

    it('should throw error when user not found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(TEST_CONSTANTS.USER_ID)).rejects.toThrow('Usuario no encontrado');
    });

    it('should handle missing school gracefully', async () => {
      // Arrange
      const mockUser = {
        id: TEST_CONSTANTS.USER_ID,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        language: 'en',
        createdPassword: false,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        school: null,
        userRoles: [],
        student: null,
      };

      const mockPermissions: string[] = [];
      const mockModules: Array<{
        id: string;
        key: string;
        name: string;
        description?: string;
        displayOrder: number;
        actions: string[];
      }> = [];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(mockCheckPermission.getUserPermissions).mockResolvedValue(mockPermissions);
      vi.mocked(mockCheckPermission.getUserModules).mockResolvedValue(mockModules);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result.schoolName).toBe('Alenna');
      expect(result.schoolId).toBe(TEST_CONSTANTS.SCHOOL_ID);
    });

    it('should filter parent links to only include users with PARENT role', async () => {
      // Arrange
      const mockUser = {
        id: TEST_CONSTANTS.USER_ID,
        email: 'student@example.com',
        firstName: 'Student',
        lastName: 'Name',
        language: 'en',
        createdPassword: false,
        schoolId: TEST_CONSTANTS.SCHOOL_ID,
        school: {
          id: TEST_CONSTANTS.SCHOOL_ID,
          name: 'Test School',
        },
        userRoles: [
          {
            role: {
              id: 'role-1',
              name: 'STUDENT',
              displayName: 'Student',
            },
          },
        ],
        student: {
          id: 'student-1',
          birthDate: new Date('2010-01-01'),
          graduationDate: new Date('2028-06-01'),
          isLeveled: false,
          certificationType: null,
          user: {
            firstName: 'Student',
            lastName: 'Name',
          },
          userStudents: [
            {
              user: {
                id: 'parent-1',
                firstName: 'Parent',
                lastName: 'One',
                userRoles: [
                  {
                    role: {
                      name: 'PARENT',
                    },
                  },
                ],
              },
            },
            {
              user: {
                id: 'teacher-1',
                firstName: 'Teacher',
                lastName: 'One',
                userRoles: [
                  {
                    role: {
                      name: 'TEACHER',
                    },
                  },
                ],
              },
            },
          ],
        },
      };

      const mockPermissions = ['students.readOwn'];
      const mockModules: Array<{
        id: string;
        key: string;
        name: string;
        description?: string;
        displayOrder: number;
        actions: string[];
      }> = [];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(mockCheckPermission.getUserPermissions).mockResolvedValue(mockPermissions);
      vi.mocked(mockCheckPermission.getUserModules).mockResolvedValue(mockModules);

      // Act
      const result = await useCase.execute(TEST_CONSTANTS.USER_ID);

      // Assert
      expect(result.studentProfile?.parents).toHaveLength(1);
      expect(result.studentProfile?.parents[0].name).toBe('Parent One');
    });
  });
});

