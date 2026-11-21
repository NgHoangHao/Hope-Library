import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User, UserStatus } from '../model/user/user.entity.js';
import { Role } from '../model/role/role.entity.js';
import { UserRole } from '../model/user-role/user-role.entity.js';
import { Loan, LoanStatus } from '../model/loan/loan.entity.js';
import { LoanItem, LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import { Fine } from '../model/fine/fine.entity.js';
import { generateNextAvailableUserCode } from '../utils/user-code.util.js';

export interface FindUsersOptions {
  page: number;
  size: number;
  search?: string;
  status?: UserStatus;
  role?: string;
}

export interface FindUsersSummaryOptions {
  page: number;
  size: number;
  search?: string;
  code?: string;
  status?: UserStatus;
  role?: string;
}

export interface UserWithLoanStats {
  user: User;
  borrowedBooksCount: number;
  expiredLoansCount: number;
  totalFineAmount: number;
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Truy vấn danh sách người dùng có phân trang, tìm kiếm theo tên hoặc username, lọc theo status và role
   */
  async findUsers(options: FindUsersOptions): Promise<[User[], number]> {
    const { page, size, search, status, role } = options;
    const skip = (page - 1) * size;

    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role');

    // Lọc theo trạng thái tài khoản
    if (status) {
      qb.andWhere('user.status = :status', { status });
    }

    // Lọc theo vai trò (tên vai trò như BORROWER, LIBRARIAN, ADMIN hoặc ID vai trò)
    if (role && role.trim()) {
      const roleVal = role.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(roleVal);
      if (isUuid) {
        qb.andWhere(
          '(role.id = :roleVal OR UPPER(role.name) = UPPER(:roleVal))',
          { roleVal },
        );
      } else {
        qb.andWhere('UPPER(role.name) = UPPER(:roleVal)', { roleVal });
      }
    }

    // Tìm kiếm theo Họ và tên (fullName) hoặc Tên tài khoản (username) hoặc email
    if (search && search.trim()) {
      const keyword = `%${search.trim()}%`;
      qb.andWhere(
        '(user.fullName LIKE :keyword OR user.username LIKE :keyword OR user.email LIKE :keyword)',
        { keyword },
      );
    }

    return await qb
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();
  }

  /**
   * Truy vấn danh sách người dùng có phân trang, tìm kiếm theo mã code, lọc theo status/role
   * kèm thống kê: số lượng sách đang mượn, số lượng loan có status EXPIRED, tổng số tiền fine.
   * Sử dụng batch aggregation theo danh sách userIds của trang để hạn chế N+1 query.
   */
  async findUsersWithLoanStats(
    options: FindUsersSummaryOptions,
  ): Promise<[UserWithLoanStats[], number]> {
    const { page, size, search, code, status } = options;
    const skip = (page - 1) * size;

    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role');

    // Lọc theo trạng thái tài khoản
    if (status) {
      qb.andWhere('user.status = :status', { status });
    }

    // Chỉ lấy những user có role là BORROWER và không mang thêm role khác (như ADMIN, LIBRARIAN)
    const roleVal = 'BORROWER';
    qb.andWhere('UPPER(role.name) = UPPER(:roleVal)', { roleVal });
    qb.andWhere(
      `NOT EXISTS (
        SELECT 1
        FROM "user_roles" "ur_other"
        INNER JOIN "roles" "r_other" ON "r_other"."id" = "ur_other"."roleId"
        WHERE "ur_other"."userId" = "user"."id"
          AND UPPER("r_other"."name") <> UPPER(:roleVal)
      )`,
      { roleVal },
    );

    // Tìm kiếm theo mã người dùng (code)
    const codeKeyword = (code ?? search)?.trim();
    if (codeKeyword) {
      qb.andWhere('user.code LIKE :codeKeyword', {
        codeKeyword: `%${codeKeyword}%`,
      });
    }

    const [users, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    if (users.length === 0) {
      return [[], total];
    }

    const userIds = users.map((u) => u.id);
    const activeLoanStatuses = [
      LoanStatus.BORROWED,
      LoanStatus.OVERDUE,
    ];

    // Thực thi song song 2 câu truy vấn gộp nhóm (GROUP BY userId) cho toàn bộ userIds của trang hiện tại (O(1) query, không bị N+1)
    const [loanStatsRaw, fineStatsRaw] = await Promise.all([
      this.dataSource
        .createQueryBuilder()
        .select('loan.userId', 'userId')
        .addSelect(
          'COUNT(DISTINCT CASE WHEN loan.status = :expiredStatus THEN loan.id ELSE NULL END)',
          'expiredLoansCount',
        )
        .addSelect(
          'COUNT(CASE WHEN loan.status IN (:...activeLoanStatuses) AND li.status = :borrowedItemStatus THEN li.id ELSE NULL END)',
          'borrowedBooksCount',
        )
        .from(Loan, 'loan')
        .leftJoin(LoanItem, 'li', 'li.loanId = loan.id')
        .where('loan.userId IN (:...userIds)', { userIds })
        .setParameters({
          expiredStatus: LoanStatus.EXPIRED,
          activeLoanStatuses,
          borrowedItemStatus: LoanItemStatus.BORROWED,
        })
        .groupBy('loan.userId')
        .getRawMany<{
          userId: string;
          expiredLoansCount: string | number;
          borrowedBooksCount: string | number;
        }>(),
      this.dataSource
        .createQueryBuilder()
        .select('fine.userId', 'userId')
        .addSelect('COALESCE(SUM(fine.amount), 0)', 'totalFineAmount')
        .from(Fine, 'fine')
        .where('fine.userId IN (:...userIds)', { userIds })
        .groupBy('fine.userId')
        .getRawMany<{
          userId: string;
          totalFineAmount: string | number;
        }>(),
    ]);

    const loanStatsMap = new Map<
      string,
      { borrowedBooksCount: number; expiredLoansCount: number }
    >();
    for (const row of loanStatsRaw) {
      if (row.userId) {
        loanStatsMap.set(row.userId.toLowerCase(), {
          borrowedBooksCount: Number(row.borrowedBooksCount) || 0,
          expiredLoansCount: Number(row.expiredLoansCount) || 0,
        });
      }
    }

    const fineStatsMap = new Map<string, number>();
    for (const row of fineStatsRaw) {
      if (row.userId) {
        fineStatsMap.set(row.userId.toLowerCase(), Number(row.totalFineAmount) || 0);
      }
    }

    const items: UserWithLoanStats[] = users.map((user) => {
      const normalizedId = user.id?.toLowerCase();
      const loanStat = normalizedId ? loanStatsMap.get(normalizedId) : undefined;
      const totalFineAmount = normalizedId ? (fineStatsMap.get(normalizedId) ?? 0) : 0;

      return {
        user,
        borrowedBooksCount: loanStat?.borrowedBooksCount ?? 0,
        expiredLoansCount: loanStat?.expiredLoansCount ?? 0,
        totalFineAmount,
      };
    });

    return [items, total];
  }

  /**
   * Tìm người dùng theo ID kèm vai trò
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: {
        userRoles: {
          role: true,
        },
      },
    });
  }

  /**
   * Tìm người dùng theo ID kèm toàn bộ các thực thể liên kết (loans, fines, auditLogs, userRoles)
   * Phục vụ kiểm tra toàn vẹn dữ liệu trước khi xóa
   */
  async findByIdWithRelations(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: {
        userRoles: {
          role: true,
        },
        loans: true,
        fines: true,
        auditLogs: true,
      },
    });
  }

  /**
   * Tìm người dùng theo tên tài khoản (username)
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { username },
    });
  }

  /**
   * Tìm người dùng theo email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
    });
  }

  /**
   * Tìm vai trò theo tên hoặc ID
   */
  async findRoleByNameOrId(nameOrId: string): Promise<Role | null> {
    const trimmed = nameOrId.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
    if (isUuid) {
      return this.roleRepo.findOne({
        where: [{ id: trimmed }, { name: trimmed }],
      });
    }
    return this.roleRepo.findOne({
      where: { name: trimmed },
    });
  }

  /**
   * Sinh mã người dùng kế tiếp theo quy tắc A-xxxx
   */
  async generateNextUserCode(manager?: EntityManager): Promise<string> {
    const target = manager ? manager.getRepository(User) : this.userRepo;
    return generateNextAvailableUserCode(target);
  }

  /**
   * Thêm mới người dùng cùng các vai trò liên kết trong một transaction
   */
  async createUserWithRoles(
    userData: {
      username: string;
      email: string;
      passwordHash: string;
      fullName?: string | null;
      phone?: string | null;
      avartarUrl?: string | null;
      code?: string | null;
      status?: UserStatus;
    },
    roles: Role[],
  ): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      let code = userData.code?.trim();
      if (!code) {
        code = await generateNextAvailableUserCode(manager);
      } else {
        const existing = await manager.findOne(User, { where: { code } });
        if (existing) {
          code = await generateNextAvailableUserCode(manager);
        }
      }

      const user = manager.create(User, {
        code,
        username: userData.username,
        email: userData.email,
        passwordHash: userData.passwordHash,
        fullName: userData.fullName || undefined,
        phone: userData.phone || null,
        avartarUrl: userData.avartarUrl || null,
        status: userData.status || UserStatus.ACTIVE,
      });

      const savedUser = await manager.save(User, user);

      for (const role of roles) {
        const userRole = manager.create(UserRole, {
          userId: savedUser.id,
          roleId: role.id,
        });
        await manager.save(UserRole, userRole);
      }

      const result = await manager.findOne(User, {
        where: { id: savedUser.id },
        relations: {
          userRoles: {
            role: true,
          },
        },
      });

      return result || savedUser;
    });
  }

  /**
   * Xóa người dùng theo ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.userRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
