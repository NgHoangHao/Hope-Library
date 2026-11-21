import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionController } from './permission.controller.js';
import { PermissionService } from '../service/permission.service.js';
import { PermissionResponse } from '../model/permission/permission.dto.js';
import { ApiResponse } from '../common/index.js';

describe('PermissionController', () => {
  let controller: PermissionController;
  let service: Partial<PermissionService>;

  beforeEach(() => {
    service = {
      getAllPermissions: vi.fn().mockResolvedValue([]),
      getPermissionsByRoleId: vi.fn().mockResolvedValue([]),
      getPermissionById: vi.fn().mockResolvedValue(new PermissionResponse()),
      createPermission: vi.fn().mockResolvedValue(new PermissionResponse()),
      updatePermission: vi.fn().mockResolvedValue(new PermissionResponse()),
      deletePermission: vi.fn().mockResolvedValue(undefined),
      getPermissionsByToken: vi.fn().mockResolvedValue([]),
    };

    controller = new PermissionController(service as PermissionService);
  });

  describe('getPermissions', () => {
    it('phải gọi getAllPermissions khi không có roleId và bọc trong ApiResponse', async () => {
      const mockResult = [
        new PermissionResponse({ id: 'perm-1', code: 'BOOK_CREATE' }),
      ];
      vi.mocked(service.getAllPermissions!).mockResolvedValueOnce(mockResult);

      const res = await controller.getPermissions();

      expect(service.getAllPermissions).toHaveBeenCalled();
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockResult);
      expect(res.message).toBe('Lấy danh sách quyền hạn thành công');
    });

    it('phải gọi getPermissionsByRoleId khi có roleId trong query và bọc trong ApiResponse', async () => {
      const mockResult = [
        new PermissionResponse({ id: 'perm-1', code: 'BOOK_CREATE' }),
      ];
      vi.mocked(service.getPermissionsByRoleId!).mockResolvedValueOnce(mockResult);

      const res = await controller.getPermissions('role-123');

      expect(service.getPermissionsByRoleId).toHaveBeenCalledWith('role-123');
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockResult);
      expect(res.message).toBe('Lấy danh sách quyền hạn theo vai trò thành công');
    });
  });

  describe('getPermissionsByRoleId', () => {
    it('phải gọi getPermissionsByRoleId với param roleId và bọc trong ApiResponse', async () => {
      const mockResult = [
        new PermissionResponse({ id: 'perm-2', code: 'BOOK_UPDATE' }),
      ];
      vi.mocked(service.getPermissionsByRoleId!).mockResolvedValueOnce(mockResult);

      const res = await controller.getPermissionsByRoleId('role-456');

      expect(service.getPermissionsByRoleId).toHaveBeenCalledWith('role-456');
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockResult);
      expect(res.message).toBe('Lấy danh sách quyền hạn theo vai trò thành công');
    });
  });

  describe('getPermissionsByToken', () => {
    it('phải trích xuất token từ request và gọi getPermissionsByToken, bọc trong ApiResponse', async () => {
      const mockResult = [
        new PermissionResponse({ id: 'perm-1', code: 'BOOK_READ' }),
      ];
      vi.mocked(service.getPermissionsByToken!).mockResolvedValueOnce(mockResult);

      const mockReq = {
        headers: {
          authorization: 'Bearer valid.jwt.token',
        },
      } as any;

      const res = await controller.getPermissionsByToken(mockReq);

      expect(service.getPermissionsByToken).toHaveBeenCalledWith('valid.jwt.token');
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockResult);
      expect(res.message).toBe('Lấy danh sách quyền hạn theo vai trò thành công');
    });
  });
});
