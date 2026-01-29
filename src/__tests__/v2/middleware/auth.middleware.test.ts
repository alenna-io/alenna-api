import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { SchoolStatus } from '@prisma/client';


vi.mock('@clerk/express', () => ({
  getAuth: vi.fn(),
}));

const mockGetUser = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());

vi.mock('@clerk/backend', () => {
  return {
    createClerkClient: vi.fn(() => ({
      users: {
        getUser: mockGetUser,
      },
    })),
  };
});

vi.mock('../../../core/infrastructure/database/prisma.client', () => ({
  default: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock('../../../../config/env', () => ({
  config: {
    clerk: {
      secretKey: 'test_secret_key',
    },
  },
}));

vi.mock('../../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { attachUserContext, requireSchoolAdmin } from '../../../core/infrastructure/frameworks/api/middleware';

describe('attachUserContext', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockReset();
    mockFindUnique.mockReset();

    mockRequest = {
      userId: undefined,
      userEmail: undefined,
      schoolId: undefined,
      userRoles: undefined,
      clerkUserId: undefined,
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  it('should attach user context when user is authenticated and exists in database', async () => {
    const mockClerkUserId = 'user_123';
    const mockSessionId = 'sess_123';
    const mockEmail = 'test@example.com';
    const mockSchoolId = 'school_123';
    const mockDbUserId = 'clm1234567890abcdefghijklmn';

    vi.mocked(getAuth).mockReturnValue({
      userId: mockClerkUserId,
      sessionId: mockSessionId,
    } as any);

    const mockClerkUser = {
      id: mockClerkUserId,
      primaryEmailAddressId: 'email_123',
      emailAddresses: [
        {
          id: 'email_123',
          emailAddress: mockEmail,
        },
      ],
      publicMetadata: {
        roles: ['school_admin'],
      },
    };

    mockGetUser.mockResolvedValue(mockClerkUser);

    mockFindUnique.mockResolvedValue({
      id: mockDbUserId,
      email: mockEmail,
      clerkId: mockClerkUserId,
      schoolId: mockSchoolId,
      deletedAt: null,
      school: {
        id: mockSchoolId,
        status: SchoolStatus.ACTIVE,
      },
      userRoles: [
        {
          role: {
            name: 'SCHOOL_ADMIN',
          },
        },
      ],
    } as any);

    await attachUserContext(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockRequest.clerkUserId).toBe(mockClerkUserId);
    expect(mockRequest.userId).toBe(mockDbUserId);
    expect(mockRequest.userEmail).toBe(mockEmail);
    expect(mockRequest.schoolId).toBe(mockSchoolId);
    expect(mockRequest.userRoles).toEqual(['school_admin']);
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 401 when user is not authenticated', async () => {
    vi.mocked(getAuth).mockReturnValue({
      userId: null,
      sessionId: null,
    } as any);

    await attachUserContext(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Authentication required. Please sign in.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when sessionId is missing', async () => {
    vi.mocked(getAuth).mockReturnValue({
      userId: 'user_123',
      sessionId: null,
    } as any);

    await attachUserContext(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 404 when user does not exist in database', async () => {
    const mockUserId = 'user_123';
    const mockSessionId = 'sess_123';

    vi.mocked(getAuth).mockReturnValue({
      userId: mockUserId,
      sessionId: mockSessionId,
    } as any);

    const mockClerkUser = {
      id: mockUserId,
      primaryEmailAddressId: 'email_123',
      emailAddresses: [
        {
          id: 'email_123',
          emailAddress: 'test@example.com',
        },
      ],
      publicMetadata: {},
    };

    mockGetUser.mockResolvedValue(mockClerkUser);
    mockFindUnique.mockResolvedValue(null);

    await attachUserContext(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Not Found',
      message: 'User not found in database. Please contact your administrator.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 when user account is deactivated', async () => {
    const mockUserId = 'user_123';
    const mockSessionId = 'sess_123';

    vi.mocked(getAuth).mockReturnValue({
      userId: mockUserId,
      sessionId: mockSessionId,
    } as any);

    const mockClerkUser = {
      id: mockUserId,
      primaryEmailAddressId: 'email_123',
      emailAddresses: [
        {
          id: 'email_123',
          emailAddress: 'test@example.com',
        },
      ],
      publicMetadata: {},
    };

    mockGetUser.mockResolvedValue(mockClerkUser);
    mockFindUnique.mockResolvedValue({
      id: mockUserId,
      email: 'test@example.com',
      schoolId: 'school_123',
      deletedAt: new Date(),
      school: null,
    } as any);

    await attachUserContext(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Your account has been deactivated.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 when school account is deactivated', async () => {
    const mockUserId = 'user_123';
    const mockSessionId = 'sess_123';

    vi.mocked(getAuth).mockReturnValue({
      userId: mockUserId,
      sessionId: mockSessionId,
    } as any);

    const mockClerkUser = {
      id: mockUserId,
      primaryEmailAddressId: 'email_123',
      emailAddresses: [
        {
          id: 'email_123',
          emailAddress: 'test@example.com',
        },
      ],
      publicMetadata: {},
    };

    mockGetUser.mockResolvedValue(mockClerkUser);
    mockFindUnique.mockResolvedValue({
      id: mockUserId,
      email: 'test@example.com',
      schoolId: 'school_123',
      deletedAt: null,
      school: {
        id: 'school_123',
        status: SchoolStatus.INACTIVE,
      },
    } as any);

    await attachUserContext(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Your school account has been deactivated. Please contact your administrator.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(getAuth).mockImplementation(() => {
      throw new Error('Clerk error');
    });

    await attachUserContext(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('requireSchoolAdmin', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      userId: 'user_123',
      userRoles: [],
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  it('should allow access when user has school_admin role', () => {
    mockRequest.userRoles = ['school_admin'];

    requireSchoolAdmin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should deny access when user does not have school_admin role', () => {
    mockRequest.userRoles = ['teacher', 'student'];

    requireSchoolAdmin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'School admin role required to access this resource.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should deny access when user has no roles', () => {
    mockRequest.userRoles = [];

    requireSchoolAdmin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when user is not authenticated', () => {
    mockRequest.userId = undefined;

    requireSchoolAdmin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
