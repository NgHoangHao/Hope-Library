import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Connection } from 'mongoose';
import { seedPermission, API_PERMISSIONS } from './permission.seeder.js';
import { Permission } from '../model/permission/permission.entity.js';
import { Role } from '../model/role/role.entity.js';
import { RolePermission } from '../model/role-permission/role-permission.entity.js';

describe('PermissionSeeder', () => {
  let mockPermModel: any;
  let mockRoleModel: any;
  let mockRolePermModel: any;
  let mockConnection: Partial<Connection>;

  const makeExec = (value: any) => ({
    exec: vi.fn().mockResolvedValue(value),
  });

  beforeEach(() => {
    mockPermModel = {
      findOne: vi.fn(() => makeExec(null)),
      find: vi.fn(() => makeExec([])),
      create: vi.fn((dto) => Promise.resolve({ id: 'perm-id', ...dto })),
    };

    mockRoleModel = {
      findOne: vi.fn(() => makeExec(null)),
      create: vi.fn((dto) => Promise.resolve({ id: 'role-id', ...dto })),
    };

    mockRolePermModel = {
      findOne: vi.fn(() => makeExec(null)),
      create: vi.fn((dto) => Promise.resolve(dto)),
    };

    mockConnection = {
      model: vi.fn((name: string) => {
        if (name === Permission.name) return mockPermModel;
        if (name === Role.name) return mockRoleModel;
        if (name === RolePermission.name) return mockRolePermModel;
        throw new Error(`Unknown model name: ${name}`);
      }) as any,
    };
  });

  it('khởi tạo thành công đầy đủ danh sách API_PERMISSIONS', async () => {
    await seedPermission(mockConnection as Connection);

    expect(mockPermModel.create).toHaveBeenCalledTimes(API_PERMISSIONS.length);
  });

  it('cập nhật description nếu quyền hạn đã tồn tại nhưng có description mới', async () => {
    const existing = {
      id: 'existing-id',
      code: API_PERMISSIONS[0].code,
      description: 'Old Description',
      save: vi.fn().mockResolvedValue(undefined),
    };

    mockPermModel.findOne.mockImplementation(({ code }: { code: string }) => {
      if (code === API_PERMISSIONS[0].code) return makeExec(existing);
      return makeExec(null);
    });

    await seedPermission(mockConnection as Connection);

    expect(existing.description).toBe(API_PERMISSIONS[0].description);
    expect(existing.save).toHaveBeenCalledTimes(1);
  });

  it('tự động gán quyền hạn cho vai trò ADMIN', async () => {
    const adminRole = { id: 'admin-role-id', name: 'ADMIN' };
    mockRoleModel.findOne.mockImplementation(({ name }: { name: string }) => {
      if (name === 'ADMIN') return makeExec(adminRole);
      return makeExec(null);
    });

    const mockPermissions = [
      { id: 'perm-1', code: 'BOOK_READ' },
      { id: 'perm-2', code: 'BOOK_CREATE' },
    ];
    mockPermModel.find.mockReturnValue(makeExec(mockPermissions));

    await seedPermission(mockConnection as Connection);

    expect(mockRolePermModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roleId: 'admin-role-id',
        permissionId: 'perm-1',
      }),
    );
    expect(mockRolePermModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roleId: 'admin-role-id',
        permissionId: 'perm-2',
      }),
    );
  });
});
