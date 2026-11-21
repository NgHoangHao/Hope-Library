import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationController } from './navigation.controller.js';
import { NavigationService } from '../service/navigation.service.js';
import {
  CreateNavigationDto,
  NavigationResponse,
  NavigationTreeResponse,
  UpdateNavigationDto,
} from '../model/navigation/navigation.dto.js';
import { ApiResponse, AppException } from '../common/index.js';

describe('NavigationController', () => {
  let controller: NavigationController;
  let service: Partial<NavigationService>;

  beforeEach(() => {
    service = {
      getAllNavigations: vi.fn().mockResolvedValue([]),
      getNavigationTree: vi.fn().mockResolvedValue([]),
      getNavigationTreeByRoleId: vi.fn().mockResolvedValue([]),
      getNavigationTreeByToken: vi.fn().mockResolvedValue([]),
      getNavigationsByRoleId: vi.fn().mockResolvedValue([]),
      getNavigationById: vi.fn().mockResolvedValue(new NavigationResponse()),
      createNavigation: vi.fn().mockResolvedValue(new NavigationResponse()),
      updateNavigation: vi.fn().mockResolvedValue(new NavigationResponse()),
      deleteNavigation: vi.fn().mockResolvedValue(undefined),
    };

    controller = new NavigationController(service as NavigationService);
  });

  describe('getNavigations', () => {
    it('phải trả về danh sách phẳng khi không truyền tree=true', async () => {
      const mockResult = [new NavigationResponse({ id: 'nav-1', code: 'NAV_1' })];
      vi.mocked(service.getAllNavigations!).mockResolvedValueOnce(mockResult);

      const res = await controller.getNavigations(false);

      expect(service.getAllNavigations).toHaveBeenCalled();
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockResult);
      expect(res.message).toBe('Lấy danh sách điều hướng thành công');
    });

    it('phải trả về danh sách cây khi truyền tree="true"', async () => {
      const mockTree = [new NavigationTreeResponse({ id: 'nav-1', code: 'NAV_1', children: [] })];
      vi.mocked(service.getNavigationTree!).mockResolvedValueOnce(mockTree);

      const res = await controller.getNavigations('true');

      expect(service.getNavigationTree).toHaveBeenCalled();
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockTree);
      expect(res.message).toBe('Lấy cây phân cấp điều hướng thành công');
    });

    it('phải gọi getNavigationTreeByRoleId khi truyền tree=true và roleId', async () => {
      const mockTree = [new NavigationTreeResponse({ id: 'nav-1', code: 'NAV_1', children: [] })];
      vi.mocked(service.getNavigationTreeByRoleId!).mockResolvedValueOnce(mockTree);

      const res = await controller.getNavigations('true', 'role-1');

      expect(service.getNavigationTreeByRoleId).toHaveBeenCalledWith('role-1');
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockTree);
      expect(res.message).toBe('Lấy cây phân cấp điều hướng theo vai trò thành công');
    });

    it('phải gọi getNavigationsByRoleId khi không truyền tree=true nhưng có roleId', async () => {
      const mockResult = [new NavigationResponse({ id: 'nav-1', code: 'NAV_1' })];
      vi.mocked(service.getNavigationsByRoleId!).mockResolvedValueOnce(mockResult);

      const res = await controller.getNavigations(false, 'role-1');

      expect(service.getNavigationsByRoleId).toHaveBeenCalledWith('role-1');
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockResult);
      expect(res.message).toBe('Lấy danh sách điều hướng theo vai trò thành công');
    });
  });

  describe('getNavigationTree', () => {
    it('phải gọi getNavigationTree và trả về ApiResponse', async () => {
      const mockTree = [new NavigationTreeResponse({ id: 'nav-1', code: 'NAV_1', children: [] })];
      vi.mocked(service.getNavigationTree!).mockResolvedValueOnce(mockTree);

      const res = await controller.getNavigationTree();

      expect(service.getNavigationTree).toHaveBeenCalled();
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockTree);
      expect(res.message).toBe('Lấy cây phân cấp điều hướng thành công');
    });

    it('phải gọi getNavigationTreeByRoleId khi có query roleId', async () => {
      const mockTree = [new NavigationTreeResponse({ id: 'nav-1', code: 'NAV_1', children: [] })];
      vi.mocked(service.getNavigationTreeByRoleId!).mockResolvedValueOnce(mockTree);

      const res = await controller.getNavigationTree('role-1');

      expect(service.getNavigationTreeByRoleId).toHaveBeenCalledWith('role-1');
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockTree);
      expect(res.message).toBe('Lấy cây phân cấp điều hướng theo vai trò thành công');
    });
  });

  describe('getNavigationTreeByRoleId', () => {
    it('phải trích xuất token từ request và gọi getNavigationTreeByToken', async () => {
      const mockTree = [new NavigationTreeResponse({ id: 'nav-1', code: 'NAV_1', children: [] })];
      vi.mocked(service.getNavigationTreeByToken!).mockResolvedValueOnce(mockTree);

      const mockReq = {
        headers: { authorization: 'Bearer valid-jwt-token' },
      } as any;

      const res = await controller.getNavigationTreeByRoleId(mockReq);

      expect(service.getNavigationTreeByToken).toHaveBeenCalledWith('valid-jwt-token');
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockTree);
      expect(res.message).toBe('Lấy cây phân cấp điều hướng theo vai trò thành công');
    });

    it('phải ném AppException.unauthorized nếu không có token trong request', async () => {
      const mockReq = {
        headers: {},
      } as any;

      await expect(controller.getNavigationTreeByRoleId(mockReq)).rejects.toThrow(
        AppException,
      );
    });
  });

  describe('getNavigationById', () => {
    it('phải gọi getNavigationById và trả về ApiResponse', async () => {
      const mockNav = new NavigationResponse({ id: 'nav-1', code: 'NAV_1' });
      vi.mocked(service.getNavigationById!).mockResolvedValueOnce(mockNav);

      const res = await controller.getNavigationById('nav-1');

      expect(service.getNavigationById).toHaveBeenCalledWith('nav-1');
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(mockNav);
    });
  });

  describe('createNavigation', () => {
    it('phải gọi createNavigation và trả về ApiResponse.created', async () => {
      const dto: CreateNavigationDto = { code: 'NAV_1', name: 'Nav 1' };
      const created = new NavigationResponse({ id: 'nav-1', code: 'NAV_1' });
      vi.mocked(service.createNavigation!).mockResolvedValueOnce(created);

      const res = await controller.createNavigation(dto);

      expect(service.createNavigation).toHaveBeenCalledWith(dto);
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.statusCode).toBe(201);
      expect(res.data).toEqual(created);
    });
  });

  describe('updateNavigation', () => {
    it('phải gọi updateNavigation và trả về ApiResponse', async () => {
      const dto: UpdateNavigationDto = { name: 'Updated' };
      const updated = new NavigationResponse({ id: 'nav-1', name: 'Updated' });
      vi.mocked(service.updateNavigation!).mockResolvedValueOnce(updated);

      const res = await controller.updateNavigation('nav-1', dto);

      expect(service.updateNavigation).toHaveBeenCalledWith('nav-1', dto);
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toEqual(updated);
    });
  });

  describe('deleteNavigation', () => {
    it('phải gọi deleteNavigation và trả về ApiResponse', async () => {
      const res = await controller.deleteNavigation('nav-1');

      expect(service.deleteNavigation).toHaveBeenCalledWith('nav-1');
      expect(res).toBeInstanceOf(ApiResponse);
      expect(res.data).toBeNull();
    });
  });
});
