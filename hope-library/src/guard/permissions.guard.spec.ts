import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { Model } from 'mongoose';
import { PermissionsGuard } from './permissions.guard.js';
import { AppException } from '../common/index.js';
import { TokenHelper } from '../utils/token.helper.js';
import type { UserRole } from '../model/user-role/user-role.entity.js';
import type { Role } from '../model/role/role.entity.js';
import type { RolePermission } from '../model/role-permission/role-permission.entity.js';
import type { Permission } from '../model/permission/permission.entity.js';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let userRoleModel: any;
  let roleModel: any;
  let rolePermissionModel: any;
  let permissionModel: any;

  const makeLeanExec = (value: any) => ({
    lean: vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue(value),
    }),
  });

  beforeEach(() => {
    reflector = new Reflector();

    userRoleModel = {
      find: vi.fn(() => makeLeanExec([])),
    };
    roleModel = {
      find: vi.fn(() => makeLeanExec([])),
    };
    rolePermissionModel = {
      find: vi.fn(() => makeLeanExec([])),
    };
    permissionModel = {
      find: vi.fn(() => makeLeanExec([])),
    };

    guard = new PermissionsGuard(
      reflector,
      userRoleModel as unknown as Model<UserRole>,
      roleModel as unknown as Model<Role>,
      rolePermissionModel as unknown as Model<RolePermission>,
      permissionModel as unknown as Model<Permission>,
    );
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

    userRoleModel.find.mockReturnValueOnce(makeLeanExec([{ roleId: 'role-admin-id' }]));
    rolePermissionModel.find.mockReturnValueOnce(makeLeanExec([{ permissionId: 'perm-1' }]));
    permissionModel.find.mockReturnValueOnce(makeLeanExec([{ code: 'BOOK_CREATE' }]));

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

    userRoleModel.find.mockReturnValueOnce(makeLeanExec([{ roleId: 'role-borrower-id' }]));
    rolePermissionModel.find.mockReturnValueOnce(makeLeanExec([{ permissionId: 'perm-read' }]));
    permissionModel.find.mockReturnValueOnce(makeLeanExec([{ code: 'BOOK_READ' }]));

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

    userRoleModel.find.mockReturnValueOnce(makeLeanExec([{ roleId: 'role-borrower-id' }]));
    rolePermissionModel.find.mockReturnValueOnce(makeLeanExec([{ permissionId: 'perm-read' }]));
    permissionModel.find.mockReturnValueOnce(makeLeanExec([{ code: 'BOOK_READ' }]));

    const context = createMockContext({ headers: { authorization: 'Bearer user-token' } });

    await expect(guard.canActivate(context)).rejects.toThrow(AppException);
  });
});
