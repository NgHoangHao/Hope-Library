import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { PermissionsGuard } from './permissions.guard.js';
import { AppException } from '../common/index.js';
import { TokenHelper } from '../utils/token.helper.js';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let dataSource: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    reflector = new Reflector();

    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([]),
    };

    dataSource = {
      createQueryBuilder: vi.fn(() => mockQueryBuilder),
    };

    guard = new PermissionsGuard(reflector, dataSource as unknown as DataSource);
  });

  const createMockContext = (
    req: Partial<Request> & { headers?: any; cookies?: any } = {},
  ): ExecutionContext => {
    return {
      getType: () => 'http',
      getClass: () => ({}),
      getHandler: () => ({}),
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;
  };

  it('cho phép truy cập nếu endpoint không yêu cầu quyền hạn', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext();

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('ném ngoại lệ Unauthorized nếu yêu cầu quyền nhưng không có token', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['BOOK_READ']);
    const context = createMockContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(AppException);
  });

  it('kiểm tra quyền của ADMIN từ CSDL thay vì tự động bypass khi quyền đã bị gỡ', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['BOOK_READ']);
    vi.spyOn(TokenHelper, 'extractTokenFromRequest').mockReturnValue('mock-token');
    vi.spyOn(TokenHelper, 'decodeToken').mockReturnValue({
      userId: 'admin-id',
      email: 'admin@hope.com',
      roles: ['ADMIN'],
    });

    mockQueryBuilder.getRawMany
      .mockResolvedValueOnce([{ roleId: 'role-admin-id' }])
      .mockResolvedValueOnce([{ code: 'BOOK_CREATE' }]);

    const context = createMockContext({ headers: { authorization: 'Bearer mock-token' } });
    await expect(guard.canActivate(context)).rejects.toThrow(AppException);
  });

  it('cho phép truy cập khi người dùng sở hữu quyền hạn trong CSDL', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['BOOK_READ']);
    vi.spyOn(TokenHelper, 'extractTokenFromRequest').mockReturnValue('user-token');
    vi.spyOn(TokenHelper, 'decodeToken').mockReturnValue({
      userId: 'user-1',
      email: 'user@hope.com',
      roles: ['BORROWER'],
    });

    mockQueryBuilder.getRawMany
      .mockResolvedValueOnce([{ roleId: 'role-borrower-id' }])
      .mockResolvedValueOnce([{ code: 'BOOK_READ' }]);

    const context = createMockContext({ headers: { authorization: 'Bearer user-token' } });
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('ném ngoại lệ Forbidden nếu người dùng không sở hữu quyền hạn yêu cầu', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['BOOK_CREATE']);
    vi.spyOn(TokenHelper, 'extractTokenFromRequest').mockReturnValue('user-token');
    vi.spyOn(TokenHelper, 'decodeToken').mockReturnValue({
      userId: 'user-1',
      email: 'user@hope.com',
      roles: ['BORROWER'],
    });

    mockQueryBuilder.getRawMany
      .mockResolvedValueOnce([{ roleId: 'role-borrower-id' }])
      .mockResolvedValueOnce([{ code: 'BOOK_READ' }]);

    const context = createMockContext({ headers: { authorization: 'Bearer user-token' } });

    await expect(guard.canActivate(context)).rejects.toThrow(AppException);
  });
});
