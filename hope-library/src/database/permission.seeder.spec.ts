import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DataSource } from 'typeorm';
import { seedPermission, API_PERMISSIONS } from './permission.seeder.js';
import { Permission } from '../model/permission/permission.entity.js';
import { Role } from '../model/role/role.entity.js';
import { RolePermission } from '../model/role-permission/role-permission.entity.js';

describe('PermissionSeeder', () => {
  let mockPermRepo: any;
  let mockRoleRepo: any;
  let mockRolePermRepo: any;
  let mockDataSource: Partial<DataSource>;

  beforeEach(() => {
    mockPermRepo = {
      findOneBy: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
      create: vi.fn((dto) => dto),
      save: vi.fn((entity) => Promise.resolve({ id: 'perm-id', ...entity })),
    };

    mockRoleRepo = {
      findOneBy: vi.fn(),
      create: vi.fn((dto) => dto),
      save: vi.fn((entity) => Promise.resolve({ id: 'role-id', ...entity })),
    };

    mockRolePermRepo = {
      findOneBy: vi.fn(),
      create: vi.fn((dto) => dto),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };

    mockDataSource = {
      getRepository: vi.fn((target: any) => {
        if (target === Permission) return mockPermRepo;
        if (target === Role) return mockRoleRepo;
        if (target === RolePermission) return mockRolePermRepo;
        throw new Error('Unknown repository target');
      }),
    };
  });

  it('khởi tạo thành công đầy đủ danh sách API_PERMISSIONS', async () => {
    mockPermRepo.findOneBy.mockResolvedValue(null);
    mockRoleRepo.findOneBy.mockResolvedValue(null);

    await seedPermission(mockDataSource as DataSource);

    expect(mockPermRepo.create).toHaveBeenCalledTimes(API_PERMISSIONS.length);
    expect(mockPermRepo.save).toHaveBeenCalledTimes(API_PERMISSIONS.length);
  });

  it('cập nhật description nếu quyền hạn đã tồn tại nhưng có description mới', async () => {
    const existing = {
      id: 'existing-id',
      code: API_PERMISSIONS[0].code,
      description: 'Old Description',
    };

    mockPermRepo.findOneBy.mockImplementation(({ code }: { code: string }) => {
      if (code === API_PERMISSIONS[0].code) return Promise.resolve(existing);
      return Promise.resolve(null);
    });
    mockRoleRepo.findOneBy.mockResolvedValue(null);

    await seedPermission(mockDataSource as DataSource);

    expect(existing.description).toBe(API_PERMISSIONS[0].description);
    expect(mockPermRepo.save).toHaveBeenCalledWith(existing);
  });

  it('tự động gán quyền hạn cho vai trò ADMIN', async () => {
    const adminRole = { id: 'admin-role-id', name: 'ADMIN' };
    mockPermRepo.findOneBy.mockResolvedValue(null);
    mockRoleRepo.findOneBy.mockImplementation(({ name }: { name: string }) => {
      if (name === 'ADMIN') return Promise.resolve(adminRole);
      return Promise.resolve(null);
    });

    const mockPermissions = [
      { id: 'perm-1', code: 'BOOK_READ' },
      { id: 'perm-2', code: 'BOOK_CREATE' },
    ];
    mockPermRepo.find.mockResolvedValue(mockPermissions);
    mockRolePermRepo.findOneBy.mockResolvedValue(null);

    await seedPermission(mockDataSource as DataSource);

    expect(mockRolePermRepo.create).toHaveBeenCalledWith({
      roleId: 'admin-role-id',
      permissionId: 'perm-1',
    });
    expect(mockRolePermRepo.create).toHaveBeenCalledWith({
      roleId: 'admin-role-id',
      permissionId: 'perm-2',
    });
  });
});
