import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionService } from './permission.service.js';
import { PermissionRepository } from '../repository/permission.repository.js';
import { PermissionMapper } from '../mapper/permission.mapper.js';
import { Permission } from '../model/permission/permission.entity.js';
import {
  CreatePermissionDto,
  PermissionResponse,
  UpdatePermissionDto,
} from '../model/permission/permission.dto.js';
import { AppException } from '../common/index.js';

describe('PermissionService', () => {
  let service: PermissionService;
  let repo: Partial<PermissionRepository>;
  let mapper: Partial<PermissionMapper>;

  beforeEach(() => {
    repo = {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      findByIdWithRolePermissions: vi.fn().mockResolvedValue(null),
      findByCode: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockImplementation(async (permission) => permission),
      delete: vi.fn().mockResolvedValue(true),
      findRoleById: vi.fn().mockResolvedValue(null),
      findByRoleId: vi.fn().mockResolvedValue([]),
      findByRoleNames: vi.fn().mockResolvedValue([]),
      findByUserId: vi.fn().mockResolvedValue([]),
    };

    mapper = {
      toResponse: vi.fn().mockImplementation((p: Permission) => {
        return new PermissionResponse({
          id: p.id,
          code: p.code,
          description: p.description,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        });
      }),
      toResponseList: vi.fn().mockImplementation((list: Permission[]) => {
        return list.map(
          (p) =>
            new PermissionResponse({
              id: p.id,
              code: p.code,
              description: p.description,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            }),
        );
      }),
      toEntity: vi.fn().mockImplementation((dto: CreatePermissionDto) => {
        return new Permission({
          code: dto.code,
          description: dto.description,
        });
      }),
    };

    service = new PermissionService(
      repo as PermissionRepository,
      mapper as PermissionMapper,
    );
  });

  describe('getAllPermissions', () => {
    it('phải trả về danh sách PermissionResponse[]', async () => {
      const mockList = [
        new Permission({ id: 'perm-1', code: 'BOOK_CREATE', description: 'Create book' }),
        new Permission({ id: 'perm-2', code: 'BOOK_DELETE', description: 'Delete book' }),
      ];
      vi.mocked(repo.findAll!).mockResolvedValueOnce(mockList);

      const result = await service.getAllPermissions();

      expect(repo.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('BOOK_CREATE');
      expect(result[1].code).toBe('BOOK_DELETE');
    });
  });

  describe('getPermissionsByRoleId', () => {
    it('phải ném lỗi 400 nếu roleId rỗng', async () => {
      await expect(service.getPermissionsByRoleId('')).rejects.toThrow(AppException);
      await expect(service.getPermissionsByRoleId('   ')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy vai trò với roleId', async () => {
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce(null);

      await expect(service.getPermissionsByRoleId('non-existent-role')).rejects.toThrow(
        AppException,
      );
    });

    it('phải trả về danh sách PermissionResponse[] khi vai trò hợp lệ', async () => {
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce({ id: 'role-1', name: 'ADMIN' } as any);
      const mockList = [
        new Permission({ id: 'perm-1', code: 'BOOK_CREATE', description: 'Create book' }),
      ];
      vi.mocked(repo.findByRoleId!).mockResolvedValueOnce(mockList);

      const result = await service.getPermissionsByRoleId('role-1');

      expect(repo.findRoleById).toHaveBeenCalledWith('role-1');
      expect(repo.findByRoleId).toHaveBeenCalledWith('role-1');
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('BOOK_CREATE');
    });
  });

  describe('getPermissionById', () => {
    it('phải ném lỗi 400 nếu id rỗng', async () => {
      await expect(service.getPermissionById('')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy quyền hạn', async () => {
      vi.mocked(repo.findById!).mockResolvedValueOnce(null);

      await expect(service.getPermissionById('non-existent-id')).rejects.toThrow(
        AppException,
      );
    });

    it('phải trả về PermissionResponse khi tìm thấy', async () => {
      const mockPermission = new Permission({
        id: 'perm-1',
        code: 'BOOK_READ',
        description: 'Read book',
      });
      vi.mocked(repo.findById!).mockResolvedValueOnce(mockPermission);

      const result = await service.getPermissionById('perm-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('perm-1');
      expect(result.code).toBe('BOOK_READ');
    });
  });

  describe('createPermission', () => {
    it('phải ném lỗi 400 khi mã code rỗng', async () => {
      await expect(service.createPermission({ code: '' })).rejects.toThrow(
        AppException,
      );
    });

    it('phải ném lỗi 400 khi mã code có độ dài < 2', async () => {
      await expect(service.createPermission({ code: 'A' })).rejects.toThrow(
        AppException,
      );
    });

    it('phải ném lỗi 409 khi mã code đã tồn tại', async () => {
      vi.mocked(repo.findByCode!).mockResolvedValueOnce(
        new Permission({ id: 'perm-existing', code: 'BOOK_CREATE' }),
      );

      await expect(
        service.createPermission({ code: 'book_create' }),
      ).rejects.toThrow(AppException);
    });

    it('phải tạo mới và trả về PermissionResponse (tự động uppercase code)', async () => {
      const dto: CreatePermissionDto = {
        code: 'book_view',
        description: 'Quyền xem sách',
      };

      const result = await service.createPermission(dto);

      expect(repo.findByCode).toHaveBeenCalledWith('BOOK_VIEW');
      expect(repo.save).toHaveBeenCalled();
      expect(result.code).toBe('BOOK_VIEW');
      expect(result.description).toBe('Quyền xem sách');
    });
  });

  describe('updatePermission', () => {
    it('phải ném lỗi 400 nếu id rỗng', async () => {
      await expect(service.updatePermission('', {})).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy quyền cần cập nhật', async () => {
      vi.mocked(repo.findById!).mockResolvedValueOnce(null);

      await expect(
        service.updatePermission('non-existent-id', { code: 'NEW_CODE' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 400 nếu mã code cập nhật là chuỗi rỗng', async () => {
      const current = new Permission({ id: 'perm-1', code: 'OLD_CODE' });
      vi.mocked(repo.findById!).mockResolvedValueOnce(current);

      await expect(
        service.updatePermission('perm-1', { code: '   ' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 409 nếu mã code mới bị trùng với quyền khác', async () => {
      const current = new Permission({ id: 'perm-1', code: 'OLD_CODE' });
      const duplicate = new Permission({ id: 'perm-2', code: 'EXISTING_CODE' });

      vi.mocked(repo.findById!).mockResolvedValueOnce(current);
      vi.mocked(repo.findByCode!).mockResolvedValueOnce(duplicate);

      await expect(
        service.updatePermission('perm-1', { code: 'EXISTING_CODE' }),
      ).rejects.toThrow(AppException);
    });

    it('phải cập nhật thành công thông tin quyền hạn', async () => {
      const current = new Permission({
        id: 'perm-1',
        code: 'OLD_CODE',
        description: 'Old desc',
      });
      vi.mocked(repo.findById!).mockResolvedValueOnce(current);

      const dto: UpdatePermissionDto = {
        code: 'NEW_CODE',
        description: 'New desc',
      };

      const result = await service.updatePermission('perm-1', dto);

      expect(current.code).toBe('NEW_CODE');
      expect(current.description).toBe('New desc');
      expect(repo.save).toHaveBeenCalledWith(current);
      expect(result.code).toBe('NEW_CODE');
    });
  });

  describe('deletePermission', () => {
    it('phải ném lỗi 400 nếu id rỗng', async () => {
      await expect(service.deletePermission('')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy quyền', async () => {
      vi.mocked(repo.findByIdWithRolePermissions!).mockResolvedValueOnce(null);

      await expect(service.deletePermission('non-existent-id')).rejects.toThrow(
        AppException,
      );
    });

    it('phải ném lỗi 400 nếu quyền đang được gán cho vai trò', async () => {
      const permission = new Permission({
        id: 'perm-1',
        code: 'ADMIN_PERM',
        rolePermissions: [{ roleId: 'role-1', permissionId: 'perm-1' } as any],
      });
      vi.mocked(repo.findByIdWithRolePermissions!).mockResolvedValueOnce(
        permission,
      );

      await expect(service.deletePermission('perm-1')).rejects.toThrow(AppException);
    });

    it('phải xóa thành công quyền hạn khi không bị ràng buộc', async () => {
      const permission = new Permission({
        id: 'perm-1',
        code: 'UNUSED_PERM',
        rolePermissions: [],
      });
      vi.mocked(repo.findByIdWithRolePermissions!).mockResolvedValueOnce(
        permission,
      );
      vi.mocked(repo.delete!).mockResolvedValueOnce(true);

      await expect(service.deletePermission('perm-1')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('perm-1');
    });
  });

  describe('getPermissionsByToken', () => {
    const createMockJwt = (payload: any) =>
      'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify(payload)).toString('base64') + '.sig';

    it('phải ném lỗi 401 nếu token rỗng', async () => {
      await expect(service.getPermissionsByToken('')).rejects.toThrow(AppException);
    });

    it('phải trả về đúng quyền hạn được gán trong CSDL cho người dùng ADMIN', async () => {
      const token = createMockJwt({
        userId: 'admin-id',
        roles: ['ADMIN'],
      });
      const assignedMock = [
        new Permission({ id: 'p-1', code: 'BOOK_CREATE' }),
        new Permission({ id: 'p-2', code: 'BOOK_DELETE' }),
      ];
      vi.mocked(repo.findByUserId!).mockResolvedValueOnce(assignedMock);

      const result = await service.getPermissionsByToken(token);

      expect(repo.findByUserId).toHaveBeenCalledWith('admin-id');
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('BOOK_CREATE');
    });

    it('phải lấy quyền theo userId nếu tìm thấy trong CSDL', async () => {
      const token = createMockJwt({
        userId: 'user-id-1',
        roles: ['LIBRARIAN'],
      });
      const userMock = [new Permission({ id: 'p-1', code: 'BOOK_READ' })];
      vi.mocked(repo.findByUserId!).mockResolvedValueOnce(userMock);

      const result = await service.getPermissionsByToken(token);

      expect(repo.findByUserId).toHaveBeenCalledWith('user-id-1');
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('BOOK_READ');
    });

    it('phải fallback lấy quyền theo vai trò (roles) nếu userId không có quyền trực tiếp', async () => {
      const token = createMockJwt({
        userId: 'user-id-2',
        roles: ['BORROWER'],
      });
      vi.mocked(repo.findByUserId!).mockResolvedValueOnce([]);
      const roleMock = [new Permission({ id: 'p-2', code: 'BORROWER_READ' })];
      vi.mocked(repo.findByRoleNames!).mockResolvedValueOnce(roleMock);

      const result = await service.getPermissionsByToken(token);

      expect(repo.findByUserId).toHaveBeenCalledWith('user-id-2');
      expect(repo.findByRoleNames).toHaveBeenCalledWith(['BORROWER']);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('BORROWER_READ');
    });
  });
});
