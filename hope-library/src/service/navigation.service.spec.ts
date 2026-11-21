import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationService } from './navigation.service.js';
import { NavigationRepository } from '../repository/navigation.repository.js';
import { NavigationMapper } from '../mapper/navigation.mapper.js';
import { Navigation } from '../model/navigation/navigation.entity.js';
import {
  CreateNavigationDto,
  NavigationResponse,
  NavigationTreeResponse,
  UpdateNavigationDto,
} from '../model/navigation/navigation.dto.js';
import { AppException } from '../common/index.js';

describe('NavigationService', () => {
  let service: NavigationService;
  let repo: Partial<NavigationRepository>;
  let mapper: Partial<NavigationMapper>;

  beforeEach(() => {
    repo = {
      findAll: vi.fn().mockResolvedValue([]),
      findRootNavigations: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      findByIdWithChildrenAndRoles: vi.fn().mockResolvedValue(null),
      findByCode: vi.fn().mockResolvedValue(null),
      findRoleById: vi.fn().mockResolvedValue({ id: 'role-1', name: 'ADMIN' } as any),
      findRoleByName: vi.fn().mockImplementation(async (name) => {
        if (name === 'ADMIN') return { id: 'admin-role-id', name: 'ADMIN' } as any;
        if (name === 'LIBRARIAN') return { id: 'librarian-role-id', name: 'LIBRARIAN' } as any;
        if (name === 'BORROWER') return { id: 'borrower-role-id', name: 'BORROWER' } as any;
        return null;
      }),
      findUserRolesByUserId: vi.fn().mockResolvedValue([]),
      findByRoleId: vi.fn().mockResolvedValue([]),
      findByIds: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockImplementation(async (nav) => nav),
      delete: vi.fn().mockResolvedValue(true),
    };

    mapper = {
      toResponse: vi.fn().mockImplementation((n: Navigation) => {
        return new NavigationResponse({
          id: n.id,
          code: n.code,
          name: n.name,
          path: n.path,
          parentId: n.parentId,
          icon: n.icon,
          sortOrder: n.sortOrder,
          isVisible: n.isVisible,
          isActive: n.isActive,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        });
      }),
      toResponseList: vi.fn().mockImplementation((list: Navigation[]) => {
        return list.map(
          (n) =>
            new NavigationResponse({
              id: n.id,
              code: n.code,
              name: n.name,
              path: n.path,
              parentId: n.parentId,
              icon: n.icon,
              sortOrder: n.sortOrder,
              isVisible: n.isVisible,
              isActive: n.isActive,
              createdAt: n.createdAt,
              updatedAt: n.updatedAt,
            }),
        );
      }),
      toTreeResponse: vi.fn().mockImplementation((n: Navigation) => {
        return new NavigationTreeResponse({
          id: n.id,
          code: n.code,
          name: n.name,
          children: [],
        });
      }),
      toTreeResponseList: vi.fn().mockImplementation((list: Navigation[]) => {
        return list.map(
          (n) =>
            new NavigationTreeResponse({
              id: n.id,
              code: n.code,
              name: n.name,
              children: [],
            }),
        );
      }),
      toTreeResponseListFromFlatList: vi.fn().mockImplementation((list: Navigation[]) => {
        return list.map(
          (n) =>
            new NavigationTreeResponse({
              id: n.id,
              code: n.code,
              name: n.name,
              children: [],
            }),
        );
      }),
      toEntity: vi.fn().mockImplementation((dto: CreateNavigationDto) => {
        return new Navigation({
          code: dto.code,
          name: dto.name,
          path: dto.path,
          parentId: dto.parentId,
          icon: dto.icon,
          sortOrder: dto.sortOrder,
          isVisible: dto.isVisible,
          isActive: dto.isActive,
        });
      }),
    };

    service = new NavigationService(
      repo as NavigationRepository,
      mapper as NavigationMapper,
    );
  });

  describe('getAllNavigations', () => {
    it('phải trả về danh sách NavigationResponse[]', async () => {
      const mockList = [
        new Navigation({ id: 'nav-1', code: 'NAV_DASHBOARD', name: 'Dashboard' }),
        new Navigation({ id: 'nav-2', code: 'NAV_BOOKS', name: 'Books' }),
      ];
      vi.mocked(repo.findAll!).mockResolvedValueOnce(mockList);

      const result = await service.getAllNavigations();

      expect(repo.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('NAV_DASHBOARD');
      expect(result[1].code).toBe('NAV_BOOKS');
    });
  });

  describe('getNavigationTree', () => {
    it('phải trả về danh sách cây NavigationTreeResponse[]', async () => {
      const mockRoots = [
        new Navigation({ id: 'nav-1', code: 'NAV_DASHBOARD', name: 'Dashboard' }),
      ];
      vi.mocked(repo.findRootNavigations!).mockResolvedValueOnce(mockRoots);

      const result = await service.getNavigationTree();

      expect(repo.findRootNavigations).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('NAV_DASHBOARD');
    });
  });

  describe('getNavigationTreeByRoleId', () => {
    it('phải ném lỗi 400 nếu roleId rỗng', async () => {
      await expect(service.getNavigationTreeByRoleId('')).rejects.toThrow(AppException);
      await expect(service.getNavigationTreeByRoleId('   ')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy vai trò', async () => {
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce(null);

      await expect(service.getNavigationTreeByRoleId('invalid-role')).rejects.toThrow(
        AppException,
      );
    });

    it('phải trả về mảng rỗng nếu vai trò chưa được gán điều hướng nào', async () => {
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce({ id: 'role-1' } as any);
      vi.mocked(repo.findByRoleId!).mockResolvedValueOnce([]);

      const result = await service.getNavigationTreeByRoleId('role-1');

      expect(result).toEqual([]);
    });

    it('phải trả về danh sách cây điều hướng và tự động bổ sung menu cha nếu thiếu', async () => {
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce({ id: 'role-1' } as any);
      const childNav = new Navigation({
        id: 'child-1',
        code: 'NAV_CHILD',
        name: 'Child',
        parentId: 'parent-1',
        sortOrder: 2,
      });
      const parentNav = new Navigation({
        id: 'parent-1',
        code: 'NAV_PARENT',
        name: 'Parent',
        parentId: null,
        sortOrder: 1,
      });

      vi.mocked(repo.findByRoleId!).mockResolvedValueOnce([childNav]);
      vi.mocked(repo.findByIds!).mockResolvedValueOnce([parentNav]);

      const result = await service.getNavigationTreeByRoleId('role-1');

      expect(repo.findByIds).toHaveBeenCalledWith(['parent-1']);
      expect(mapper.toTreeResponseListFromFlatList).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });

  describe('getNavigationsByRoleId', () => {
    it('phải ném lỗi 400 nếu roleId rỗng', async () => {
      await expect(service.getNavigationsByRoleId('')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy vai trò', async () => {
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce(null);

      await expect(service.getNavigationsByRoleId('invalid-role')).rejects.toThrow(
        AppException,
      );
    });

    it('phải trả về danh sách NavigationResponse[] theo vai trò', async () => {
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce({ id: 'role-1' } as any);
      const mockList = [new Navigation({ id: 'nav-1', code: 'NAV_1' })];
      vi.mocked(repo.findByRoleId!).mockResolvedValueOnce(mockList);

      const result = await service.getNavigationsByRoleId('role-1');

      expect(repo.findByRoleId).toHaveBeenCalledWith('role-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getNavigationTreeByToken (Role Priority: ADMIN > LIBRARIAN > BORROWER)', () => {
    const createMockJwt = (payload: any) =>
      'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify(payload)).toString('base64') + '.sig';

    it('phải ưu tiên chọn ADMIN khi token chứa cả ADMIN và BORROWER', async () => {
      const token = createMockJwt({
        userId: 'u-1',
        roles: ['BORROWER', 'ADMIN'],
      });
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce({ id: 'admin-role-id', name: 'ADMIN' } as any);

      await service.getNavigationTreeByToken(token);

      expect(repo.findByRoleId).toHaveBeenCalledWith('admin-role-id');
    });

    it('phải ưu tiên chọn LIBRARIAN khi token chứa cả LIBRARIAN và BORROWER', async () => {
      const token = createMockJwt({
        userId: 'u-1',
        roles: ['BORROWER', 'LIBRARIAN'],
      });
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce({ id: 'librarian-role-id', name: 'LIBRARIAN' } as any);

      await service.getNavigationTreeByToken(token);

      expect(repo.findByRoleId).toHaveBeenCalledWith('librarian-role-id');
    });

    it('phải chọn BORROWER khi token chỉ có BORROWER', async () => {
      const token = createMockJwt({
        userId: 'u-1',
        roles: ['BORROWER'],
      });
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce({ id: 'borrower-role-id', name: 'BORROWER' } as any);

      await service.getNavigationTreeByToken(token);

      expect(repo.findByRoleId).toHaveBeenCalledWith('borrower-role-id');
    });

    it('phải ưu tiên ADMIN khi có cả 3 vai trò ADMIN, LIBRARIAN, BORROWER', async () => {
      const token = createMockJwt({
        userId: 'u-1',
        roles: ['BORROWER', 'LIBRARIAN', 'ADMIN'],
      });
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce({ id: 'admin-role-id', name: 'ADMIN' } as any);

      await service.getNavigationTreeByToken(token);

      expect(repo.findByRoleId).toHaveBeenCalledWith('admin-role-id');
    });

    it('phải fallback truy vấn vai trò trong DB theo userId khi token không có mảng roles', async () => {
      const token = createMockJwt({
        userId: 'u-1',
        roles: [],
      });

      vi.mocked(repo.findUserRolesByUserId!).mockResolvedValueOnce([
        { roleId: 'borrower-role-id', role: { id: 'borrower-role-id', name: 'BORROWER' } } as any,
        { roleId: 'admin-role-id', role: { id: 'admin-role-id', name: 'ADMIN' } } as any,
      ]);
      vi.mocked(repo.findRoleById!).mockResolvedValueOnce({ id: 'admin-role-id', name: 'ADMIN' } as any);

      await service.getNavigationTreeByToken(token);

      expect(repo.findUserRolesByUserId).toHaveBeenCalledWith('u-1');
      expect(repo.findByRoleId).toHaveBeenCalledWith('admin-role-id');
    });

    it('phải ném lỗi 403 nếu token và DB đều không có vai trò nào', async () => {
      const token = createMockJwt({
        userId: 'u-1',
        roles: [],
      });
      vi.mocked(repo.findUserRolesByUserId!).mockResolvedValueOnce([]);

      await expect(service.getNavigationTreeByToken(token)).rejects.toThrow(AppException);
    });
  });

  describe('getNavigationById', () => {
    it('phải ném lỗi 400 nếu id rỗng', async () => {
      await expect(service.getNavigationById('')).rejects.toThrow(AppException);
      await expect(service.getNavigationById('   ')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy điều hướng', async () => {
      vi.mocked(repo.findById!).mockResolvedValueOnce(null);

      await expect(service.getNavigationById('non-existent-id')).rejects.toThrow(
        AppException,
      );
    });

    it('phải trả về NavigationResponse khi tìm thấy', async () => {
      const mockNav = new Navigation({ id: 'nav-1', code: 'NAV_BOOKS', name: 'Quản lý sách' });
      vi.mocked(repo.findById!).mockResolvedValueOnce(mockNav);

      const result = await service.getNavigationById('nav-1');

      expect(repo.findById).toHaveBeenCalledWith('nav-1');
      expect(result.id).toBe('nav-1');
      expect(result.code).toBe('NAV_BOOKS');
    });
  });

  describe('createNavigation', () => {
    it('phải ném lỗi 400 nếu code rỗng hoặc không đúng độ dài', async () => {
      await expect(
        service.createNavigation({ code: '', name: 'Test' } as any),
      ).rejects.toThrow(AppException);

      await expect(
        service.createNavigation({ code: 'A', name: 'Test' } as any),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 400 nếu name rỗng', async () => {
      await expect(
        service.createNavigation({ code: 'NAV_TEST', name: '' } as any),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 409 nếu mã code đã tồn tại', async () => {
      vi.mocked(repo.findByCode!).mockResolvedValueOnce(
        new Navigation({ id: 'existing-id', code: 'NAV_TEST' }),
      );

      await expect(
        service.createNavigation({ code: 'NAV_TEST', name: 'Test Menu' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu parentId không tồn tại', async () => {
      vi.mocked(repo.findByCode!).mockResolvedValueOnce(null);
      vi.mocked(repo.findById!).mockResolvedValueOnce(null);

      await expect(
        service.createNavigation({
          code: 'NAV_CHILD',
          name: 'Child Menu',
          parentId: 'invalid-parent',
        }),
      ).rejects.toThrow(AppException);
    });

    it('phải tạo điều hướng mới thành công', async () => {
      vi.mocked(repo.findByCode!).mockResolvedValueOnce(null);
      const dto: CreateNavigationDto = {
        code: 'nav_books',
        name: 'Quản lý sách',
        path: '/books',
        icon: 'book',
        sortOrder: 1,
      };

      const result = await service.createNavigation(dto);

      expect(repo.save).toHaveBeenCalled();
      expect(result.code).toBe('NAV_BOOKS');
      expect(result.name).toBe('Quản lý sách');
    });
  });

  describe('updateNavigation', () => {
    it('phải ném lỗi 400 nếu id rỗng', async () => {
      await expect(service.updateNavigation('', {})).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy điều hướng', async () => {
      vi.mocked(repo.findById!).mockResolvedValueOnce(null);

      await expect(service.updateNavigation('non-existent', {})).rejects.toThrow(
        AppException,
      );
    });

    it('phải ném lỗi 400 nếu đặt parentId là chính nó', async () => {
      const mockNav = new Navigation({ id: 'nav-1', code: 'NAV_TEST', name: 'Test' });
      vi.mocked(repo.findById!).mockResolvedValueOnce(mockNav);

      await expect(
        service.updateNavigation('nav-1', { parentId: 'nav-1' }),
      ).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 409 nếu cập nhật code trùng với bản ghi khác', async () => {
      const mockNav = new Navigation({ id: 'nav-1', code: 'NAV_TEST', name: 'Test' });
      vi.mocked(repo.findById!).mockResolvedValueOnce(mockNav);
      vi.mocked(repo.findByCode!).mockResolvedValueOnce(
        new Navigation({ id: 'nav-2', code: 'NAV_OTHER' }),
      );

      await expect(
        service.updateNavigation('nav-1', { code: 'NAV_OTHER' }),
      ).rejects.toThrow(AppException);
    });

    it('phải cập nhật thông tin thành công', async () => {
      const mockNav = new Navigation({ id: 'nav-1', code: 'NAV_OLD', name: 'Old' });
      vi.mocked(repo.findById!).mockResolvedValueOnce(mockNav);

      const result = await service.updateNavigation('nav-1', {
        name: 'New Name',
        sortOrder: 5,
      });

      expect(repo.save).toHaveBeenCalled();
      expect(result.name).toBe('New Name');
    });
  });

  describe('deleteNavigation', () => {
    it('phải ném lỗi 400 nếu id rỗng', async () => {
      await expect(service.deleteNavigation('')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 404 nếu không tìm thấy điều hướng', async () => {
      vi.mocked(repo.findByIdWithChildrenAndRoles!).mockResolvedValueOnce(null);

      await expect(service.deleteNavigation('non-existent')).rejects.toThrow(
        AppException,
      );
    });

    it('phải ném lỗi 400 nếu điều hướng có menu con', async () => {
      const mockNav = new Navigation({
        id: 'nav-1',
        children: [new Navigation({ id: 'child-1' })] as any,
      });
      vi.mocked(repo.findByIdWithChildrenAndRoles!).mockResolvedValueOnce(mockNav);

      await expect(service.deleteNavigation('nav-1')).rejects.toThrow(AppException);
    });

    it('phải ném lỗi 400 nếu điều hướng đã gán cho vai trò', async () => {
      const mockNav = new Navigation({
        id: 'nav-1',
        children: [],
        roleNavigations: [{ roleId: 'role-1' }] as any,
      });
      vi.mocked(repo.findByIdWithChildrenAndRoles!).mockResolvedValueOnce(mockNav);

      await expect(service.deleteNavigation('nav-1')).rejects.toThrow(AppException);
    });

    it('phải xóa thành công khi không có ràng buộc', async () => {
      const mockNav = new Navigation({
        id: 'nav-1',
        children: [],
        roleNavigations: [],
      });
      vi.mocked(repo.findByIdWithChildrenAndRoles!).mockResolvedValueOnce(mockNav);
      vi.mocked(repo.delete!).mockResolvedValueOnce(true);

      await service.deleteNavigation('nav-1');

      expect(repo.delete).toHaveBeenCalledWith('nav-1');
    });
  });
});
