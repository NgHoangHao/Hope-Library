import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Connection, Model } from 'mongoose';
import { UserRepository } from './user.repository.js';
import { User } from '../model/user/user.entity.js';
import { Role } from '../model/role/role.entity.js';
import { UserRole } from '../model/user-role/user-role.entity.js';
import type { Loan } from '../model/loan/loan.entity.js';
import type { Fine } from '../model/fine/fine.entity.js';
import type { AuditLog } from '../model/audit-log/audit-log.entity.js';

describe('UserRepository', () => {
  let repository: UserRepository;
  let mockUserModel: any;
  let mockRoleModel: any;
  let mockUserRoleModel: any;
  let mockLoanModel: any;
  let mockFineModel: any;
  let mockAuditLogModel: any;
  let mockConnection: any;

  const makeChain = (result: any) => {
    const chain: any = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      session: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(result),
    };
    return chain;
  };

  beforeEach(() => {
    mockUserModel = {
      find: vi.fn(() => makeChain([])),
      findOne: vi.fn(() => makeChain(null)),
      countDocuments: vi.fn(() => ({ exec: vi.fn().mockResolvedValue(0) })),
      aggregate: vi.fn(() => makeChain([])),
      exists: vi.fn().mockResolvedValue(null),
      create: vi.fn(async (docs: any[]) => docs),
      deleteOne: vi.fn(() => ({ exec: vi.fn().mockResolvedValue({ deletedCount: 1 }) })),
    };

    mockRoleModel = {
      find: vi.fn(() => makeChain([])),
      findOne: vi.fn(() => makeChain(null)),
    };

    mockUserRoleModel = {
      find: vi.fn(() => makeChain([])),
      create: vi.fn(async (docs: any[]) => docs),
      deleteMany: vi.fn(() => ({ exec: vi.fn().mockResolvedValue({ deletedCount: 1 }) })),
    };

    mockLoanModel = {
      find: vi.fn(() => makeChain([])),
      aggregate: vi.fn(() => ({ exec: vi.fn().mockResolvedValue([]) })),
    };

    mockFineModel = {
      find: vi.fn(() => makeChain([])),
      aggregate: vi.fn(() => ({ exec: vi.fn().mockResolvedValue([]) })),
    };

    mockAuditLogModel = {
      find: vi.fn(() => makeChain([])),
    };

    const mockSession = {
      withTransaction: vi.fn(async (cb: () => Promise<void>) => cb()),
      endSession: vi.fn().mockResolvedValue(undefined),
    };

    mockConnection = {
      startSession: vi.fn().mockResolvedValue(mockSession),
    };

    repository = new UserRepository(
      mockUserModel as unknown as Model<User>,
      mockRoleModel as unknown as Model<Role>,
      mockUserRoleModel as unknown as Model<UserRole>,
      mockLoanModel as unknown as Model<Loan>,
      mockFineModel as unknown as Model<Fine>,
      mockAuditLogModel as unknown as Model<AuditLog>,
      mockConnection as unknown as Connection,
    );
  });

  describe('findUsers - Role filter & UUID safeguard', () => {
    it('khi lọc theo tên vai trò (không phải UUID), truy vấn role theo regex tên', async () => {
      mockRoleModel.find.mockReturnValueOnce(makeChain([{ id: 'r-borrower' }]));
      mockUserRoleModel.find.mockReturnValueOnce(makeChain([{ userId: 'u-1' }]));

      await repository.findUsers({
        page: 1,
        size: 10,
        role: 'BORROWER',
      });

      const roleFilter = mockRoleModel.find.mock.calls[0][0];
      expect(roleFilter).toHaveProperty('name');
      expect(roleFilter.name).toBeInstanceOf(RegExp);
      expect(roleFilter.name.test('borrower')).toBe(true);
    });

    it('khi lọc theo UUID của role, truy vấn cả id và name', async () => {
      const roleUuid = 'e0d7c570-32b0-4660-84c4-722a4bb4be7a';
      mockRoleModel.find.mockReturnValueOnce(makeChain([{ id: roleUuid }]));
      mockUserRoleModel.find.mockReturnValueOnce(makeChain([{ userId: 'u-1' }]));

      await repository.findUsers({
        page: 1,
        size: 10,
        role: roleUuid,
      });

      const roleFilter = mockRoleModel.find.mock.calls[0][0];
      expect(roleFilter.$or).toBeDefined();
      expect(roleFilter.$or[0]).toEqual({ id: roleUuid });
    });
  });

  describe('findRoleByNameOrId', () => {
    it('khi tìm kiếm bằng tên role (không phải UUID), chỉ truy vấn theo name', async () => {
      mockRoleModel.findOne.mockReturnValueOnce(makeChain({ id: 'r-1', name: 'ADMIN' }));

      const role = await repository.findRoleByNameOrId('ADMIN');

      expect(mockRoleModel.findOne).toHaveBeenCalledWith({ name: 'ADMIN' });
      expect(role?.name).toBe('ADMIN');
    });

    it('khi tìm kiếm bằng UUID, truy vấn theo cả id và name', async () => {
      const roleUuid = 'e0d7c570-32b0-4660-84c4-722a4bb4be7a';
      mockRoleModel.findOne.mockReturnValueOnce(makeChain({ id: roleUuid, name: 'ADMIN' }));

      await repository.findRoleByNameOrId(roleUuid);

      expect(mockRoleModel.findOne).toHaveBeenCalledWith({
        $or: [{ id: roleUuid }, { name: roleUuid }],
      });
    });
  });

  describe('generateNextUserCode & createUserWithRoles', () => {
    it('generateNextUserCode gọi aggregate và trả về mã kế tiếp', async () => {
      mockUserModel.aggregate.mockReturnValueOnce(makeChain([{ code: 'A-0001' }]));
      mockUserModel.exists.mockResolvedValue(null);

      const nextCode = await repository.generateNextUserCode();
      expect(nextCode).toBe('A-0002');
    });

    it('createUserWithRoles tự động sinh mã code theo quy tắc nếu chưa truyền', async () => {
      mockUserModel.aggregate.mockReturnValueOnce(makeChain([{ code: 'A-9999' }]));
      mockUserModel.exists.mockResolvedValue(null);

      const result = await repository.createUserWithRoles(
        {
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hash',
        },
        [new Role({ id: 'r-1', name: 'BORROWER' })],
      );

      expect(mockUserModel.create).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            code: 'B-0001',
            username: 'testuser',
          }),
        ],
        expect.objectContaining({ session: expect.anything() }),
      );
      expect(result.code).toBe('B-0001');
    });
  });

  describe('findUsersWithLoanStats', () => {
    it('nên tìm kiếm theo code, lọc theo status và thực hiện batch aggregation tránh N+1 query', async () => {
      mockRoleModel.find
        .mockReturnValueOnce(
          makeChain([
            { id: 'r-borrower', name: 'BORROWER' },
            { id: 'r-admin', name: 'ADMIN' },
          ]),
        )
        .mockReturnValueOnce(makeChain([{ id: 'r-borrower', name: 'BORROWER' }]));

      mockUserRoleModel.find
        .mockReturnValueOnce(makeChain([{ userId: 'u-1' }, { userId: 'u-2' }]))
        .mockReturnValueOnce(makeChain([]))
        .mockReturnValueOnce(
          makeChain([
            { userId: 'u-1', roleId: 'r-borrower' },
            { userId: 'u-2', roleId: 'r-borrower' },
          ]),
        );

      mockUserModel.find.mockReturnValueOnce(
        makeChain([
          { id: 'u-1', code: 'A-0001', username: 'user1' },
          { id: 'u-2', code: 'A-0002', username: 'user2' },
        ]),
      );
      mockUserModel.countDocuments.mockReturnValueOnce({
        exec: vi.fn().mockResolvedValue(2),
      });

      mockLoanModel.aggregate.mockReturnValueOnce({
        exec: vi.fn().mockResolvedValue([
          { _id: 'U-1', borrowedBooksCount: 2, expiredLoansCount: 1 },
        ]),
      });
      mockFineModel.aggregate.mockReturnValueOnce({
        exec: vi.fn().mockResolvedValue([{ _id: 'u-1', totalFineAmount: 50000 }]),
      });

      const [items, total] = await repository.findUsersWithLoanStats({
        page: 1,
        size: 10,
        search: 'A-000',
        status: 'ACTIVE' as any,
      });

      expect(total).toBe(2);
      expect(items).toHaveLength(2);
      expect(items[0].user.id).toBe('u-1');
      expect(items[0].borrowedBooksCount).toBe(2);
      expect(items[0].expiredLoansCount).toBe(1);
      expect(items[0].totalFineAmount).toBe(50000);
      expect(items[1].user.id).toBe('u-2');
      expect(items[1].borrowedBooksCount).toBe(0);
      expect(items[1].expiredLoansCount).toBe(0);
      expect(items[1].totalFineAmount).toBe(0);
    });

    it('nên trả về mảng rỗng ngay lập tức và không gọi query thống kê nếu không có user nào', async () => {
      mockRoleModel.find.mockReturnValueOnce(makeChain([{ id: 'r-borrower', name: 'BORROWER' }]));
      mockUserRoleModel.find.mockReturnValueOnce(makeChain([]));

      const [items, total] = await repository.findUsersWithLoanStats({
        page: 1,
        size: 10,
      });

      expect(total).toBe(0);
      expect(items).toEqual([]);
      expect(mockLoanModel.aggregate).not.toHaveBeenCalled();
      expect(mockFineModel.aggregate).not.toHaveBeenCalled();
    });
  });
});
