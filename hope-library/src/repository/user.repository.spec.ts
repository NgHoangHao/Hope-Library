import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRepository } from './user.repository.js';
import { Repository, DataSource } from 'typeorm';
import { User } from '../model/user/user.entity.js';
import { Role } from '../model/role/role.entity.js';
import { UserRole } from '../model/user-role/user-role.entity.js';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockUserRepo: any;
  let mockRoleRepo: any;
  let mockUserRoleRepo: any;
  let mockDataSource: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    mockQueryBuilder = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      addOrderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
      getOne: vi.fn().mockResolvedValue(null),
    };

    mockUserRepo = {
      createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder),
      findOne: vi.fn(),
      delete: vi.fn(),
    };

    mockRoleRepo = {
      findOne: vi.fn(),
    };

    mockUserRoleRepo = {};
    mockDataSource = {
      transaction: vi.fn(),
    };

    repository = new UserRepository(
      mockUserRepo as unknown as Repository<User>,
      mockRoleRepo as unknown as Repository<Role>,
      mockUserRoleRepo as unknown as Repository<UserRole>,
      mockDataSource as unknown as DataSource,
    );
  });

  describe('findUsers - Role filter & UUID safeguard', () => {
    it('khi lọc theo tên vai trò (không phải UUID), chỉ so sánh theo UPPER(role.name)', async () => {
      await repository.findUsers({
        page: 1,
        size: 10,
        role: 'BORROWER',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'UPPER(role.name) = UPPER(:roleVal)',
        { roleVal: 'BORROWER' },
      );
    });

    it('khi lọc theo UUID của role, so sánh cả role.id và role.name', async () => {
      const roleUuid = 'e0d7c570-32b0-4660-84c4-722a4bb4be7a';
      await repository.findUsers({
        page: 1,
        size: 10,
        role: roleUuid,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(role.id = :roleVal OR UPPER(role.name) = UPPER(:roleVal))',
        { roleVal: roleUuid },
      );
    });
  });

  describe('findRoleByNameOrId', () => {
    it('khi tìm kiếm bằng tên role (không phải UUID), chỉ truy vấn theo name', async () => {
      mockRoleRepo.findOne.mockResolvedValue(new Role({ id: 'r-1', name: 'ADMIN' }));

      await repository.findRoleByNameOrId('ADMIN');

      expect(mockRoleRepo.findOne).toHaveBeenCalledWith({
        where: { name: 'ADMIN' },
      });
    });

    it('khi tìm kiếm bằng UUID, truy vấn theo cả id và name', async () => {
      const roleUuid = 'e0d7c570-32b0-4660-84c4-722a4bb4be7a';
      mockRoleRepo.findOne.mockResolvedValue(new Role({ id: roleUuid, name: 'ADMIN' }));

      await repository.findRoleByNameOrId(roleUuid);

      expect(mockRoleRepo.findOne).toHaveBeenCalledWith({
        where: [{ id: roleUuid }, { name: roleUuid }],
      });
    });
  });

  describe('generateNextUserCode & createUserWithRoles', () => {
    it('generateNextUserCode gọi queryBuilder và trả về mã kế tiếp', async () => {
      mockQueryBuilder.getOne.mockResolvedValueOnce({ code: 'A-0001' });
      mockUserRepo.exists = vi.fn().mockResolvedValue(false);

      const nextCode = await repository.generateNextUserCode();
      expect(nextCode).toBe('A-0002');
    });

    it('createUserWithRoles tự động sinh mã code theo quy tắc nếu chưa truyền', async () => {
      const mockManager: any = {
        createQueryBuilder: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          addOrderBy: vi.fn().mockReturnThis(),
          getOne: vi.fn().mockResolvedValue({ code: 'A-9999' }),
        }),
        findOne: vi.fn().mockResolvedValue(null),
        exists: vi.fn().mockResolvedValue(false),
        create: vi.fn().mockImplementation((entityClass, data) => data),
        save: vi.fn().mockImplementation(async (entityClass, data) => ({ id: 'u-1', ...data })),
      };

      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(mockManager));

      const result = await repository.createUserWithRoles(
        {
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hash',
        },
        [new Role({ id: 'r-1', name: 'BORROWER' })],
      );

      expect(mockManager.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          code: 'B-0001',
          username: 'testuser',
        }),
      );
    });
  });

  describe('findUsersWithLoanStats', () => {
    it('nên tìm kiếm theo code, lọc theo status và thực hiện batch aggregation tránh N+1 query', async () => {
      const mockUsers = [
        new User({ id: 'u-1', code: 'A-0001', username: 'user1' }),
        new User({ id: 'u-2', code: 'A-0002', username: 'user2' }),
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([mockUsers, 2]);

      const mockLoanQb: any = {
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        setParameters: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          { userId: 'U-1', borrowedBooksCount: '2', expiredLoansCount: '1' },
        ]),
      };

      const mockFineQb: any = {
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([
          { userId: 'u-1', totalFineAmount: '50000' },
        ]),
      };

      mockDataSource.createQueryBuilder = vi
        .fn()
        .mockReturnValueOnce(mockLoanQb)
        .mockReturnValueOnce(mockFineQb);

      const [items, total] = await repository.findUsersWithLoanStats({
        page: 1,
        size: 10,
        search: 'A-000',
        status: 'ACTIVE' as any,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.status = :status',
        { status: 'ACTIVE' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'UPPER(role.name) = UPPER(:roleVal)',
        { roleVal: 'BORROWER' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('NOT EXISTS'),
        { roleVal: 'BORROWER' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.code LIKE :codeKeyword',
        { codeKeyword: '%A-000%' },
      );
      expect(total).toBe(2);
      expect(items).toHaveLength(2);
      expect(items[0]).toEqual({
        user: mockUsers[0],
        borrowedBooksCount: 2,
        expiredLoansCount: 1,
        totalFineAmount: 50000,
      });
      expect(items[1]).toEqual({
        user: mockUsers[1],
        borrowedBooksCount: 0,
        expiredLoansCount: 0,
        totalFineAmount: 0,
      });
    });

    it('nên trả về mảng rỗng ngay lập tức và không gọi query thống kê nếu không có user nào', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValueOnce([[], 0]);
      mockDataSource.createQueryBuilder = vi.fn();

      const [items, total] = await repository.findUsersWithLoanStats({
        page: 1,
        size: 10,
      });

      expect(total).toBe(0);
      expect(items).toEqual([]);
      expect(mockDataSource.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
