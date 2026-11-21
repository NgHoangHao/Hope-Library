import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Connection, Model } from 'mongoose';
import { User, UserStatus } from '../model/user/user.entity.js';
import { Role } from '../model/role/role.entity.js';
import { UserRole } from '../model/user-role/user-role.entity.js';
import { Loan, LoanStatus } from '../model/loan/loan.entity.js';
import { LoanItem, LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import { Fine } from '../model/fine/fine.entity.js';
import { AuditLog } from '../model/audit-log/audit-log.entity.js';
import { generateNextAvailableUserCode } from '../utils/user-code.util.js';
import {
  buildContainsRegex,
  buildExactIgnoreCaseRegex,
  prepareDocumentForSave,
  toEntities,
  toEntity,
} from '../database/mongo.helper.js';

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
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
    @InjectModel(UserRole.name)
    private readonly userRoleModel: Model<UserRole>,
    @InjectModel(Loan.name)
    private readonly loanModel: Model<Loan>,
    @InjectModel(Fine.name)
    private readonly fineModel: Model<Fine>,
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  private async attachUserRolesBatch(
    users: User[],
    session?: ClientSession,
  ): Promise<User[]> {
    if (users.length === 0) return users;
    const userIds = users.map((u) => u.id);

    const urQuery = this.userRoleModel.find({ userId: { $in: userIds } }).lean();
    if (session) urQuery.session(session);
    const urDocs = await urQuery.exec();
    const userRoles = toEntities(UserRole, urDocs);

    const roleIds = [...new Set(userRoles.map((ur) => ur.roleId).filter(Boolean))];
    let roleMap = new Map<string, Role>();
    if (roleIds.length > 0) {
      const roleQuery = this.roleModel.find({ id: { $in: roleIds } }).lean();
      if (session) roleQuery.session(session);
      const roleDocs = await roleQuery.exec();
      roleMap = new Map(toEntities(Role, roleDocs).map((r) => [r.id, r]));
    }

    const urByUser = new Map<string, UserRole[]>();
    for (const ur of userRoles) {
      ur.role = roleMap.get(ur.roleId);
      const list = urByUser.get(ur.userId) ?? [];
      list.push(ur);
      urByUser.set(ur.userId, list);
    }

    for (const user of users) {
      user.userRoles = urByUser.get(user.id) ?? [];
    }

    return users;
  }

  /**
   * Truy vấn danh sách người dùng có phân trang, tìm kiếm theo tên hoặc username, lọc theo status và role
   */
  async findUsers(options: FindUsersOptions): Promise<[User[], number]> {
    const { page, size, search, status, role } = options;
    const skip = (page - 1) * size;

    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }

    if (role && role.trim()) {
      const roleVal = role.trim();
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          roleVal,
        );
      const roleFilter = isUuid
        ? { $or: [{ id: roleVal }, { name: buildExactIgnoreCaseRegex(roleVal) }] }
        : { name: buildExactIgnoreCaseRegex(roleVal) };

      const matchedRoles = await this.roleModel
        .find(roleFilter, { id: 1 })
        .lean()
        .exec();
      const matchedRoleIds = matchedRoles.map((r) => r.id);
      if (matchedRoleIds.length === 0) {
        return [[], 0];
      }

      const matchedUserRoles = await this.userRoleModel
        .find({ roleId: { $in: matchedRoleIds } }, { userId: 1 })
        .lean()
        .exec();
      const matchedUserIds = [...new Set(matchedUserRoles.map((ur) => ur.userId))];
      if (matchedUserIds.length === 0) {
        return [[], 0];
      }

      filter.id = { $in: matchedUserIds };
    }

    if (search && search.trim()) {
      const regex = buildContainsRegex(search);
      filter.$or = [
        { fullName: regex },
        { username: regex },
        { email: regex },
      ];
    }

    const [docs, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const users = await this.attachUserRolesBatch(toEntities(User, docs));
    return [users, total];
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

    // Chỉ lấy những user có role là BORROWER và không mang thêm role khác (như ADMIN, LIBRARIAN)
    const allRoles = await this.roleModel.find({}, { id: 1, name: 1 }).lean().exec();
    const borrowerRoleIds = allRoles
      .filter((r) => r.name?.toUpperCase() === 'BORROWER')
      .map((r) => r.id);
    const otherRoleIds = allRoles
      .filter((r) => r.name?.toUpperCase() !== 'BORROWER')
      .map((r) => r.id);

    if (borrowerRoleIds.length === 0) {
      return [[], 0];
    }

    const [borrowerUserRoles, otherUserRoles] = await Promise.all([
      this.userRoleModel
        .find({ roleId: { $in: borrowerRoleIds } }, { userId: 1 })
        .lean()
        .exec(),
      otherRoleIds.length > 0
        ? this.userRoleModel
            .find({ roleId: { $in: otherRoleIds } }, { userId: 1 })
            .lean()
            .exec()
        : Promise.resolve([]),
    ]);

    const otherUserIdSet = new Set(otherUserRoles.map((ur) => ur.userId));
    const eligibleUserIds = [
      ...new Set(
        borrowerUserRoles
          .map((ur) => ur.userId)
          .filter((uid) => !otherUserIdSet.has(uid)),
      ),
    ];

    if (eligibleUserIds.length === 0) {
      return [[], 0];
    }

    const filter: Record<string, any> = {
      id: { $in: eligibleUserIds },
    };

    if (status) {
      filter.status = status;
    }

    const codeKeyword = (code ?? search)?.trim();
    if (codeKeyword) {
      filter.code = buildContainsRegex(codeKeyword);
    }

    const [docs, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .lean()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const users = await this.attachUserRolesBatch(toEntities(User, docs));
    if (users.length === 0) {
      return [[], total];
    }

    const userIds = users.map((u) => u.id);
    const activeLoanStatuses = [LoanStatus.BORROWED, LoanStatus.OVERDUE];

    const [loanStatsRaw, fineStatsRaw] = await Promise.all([
      this.loanModel
        .aggregate<{
          _id: string;
          expiredLoansCount: number;
          borrowedBooksCount: number;
        }>([
          { $match: { userId: { $in: userIds } } },
          {
            $lookup: {
              from: 'loan_items',
              localField: 'id',
              foreignField: 'loanId',
              as: 'items',
            },
          },
          {
            $project: {
              userId: 1,
              isExpired: { $cond: [{ $eq: ['$status', LoanStatus.EXPIRED] }, 1, 0] },
              borrowedItemsCount: {
                $cond: [
                  { $in: ['$status', activeLoanStatuses] },
                  {
                    $size: {
                      $filter: {
                        input: '$items',
                        as: 'item',
                        cond: { $eq: ['$$item.status', LoanItemStatus.BORROWED] },
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $group: {
              _id: '$userId',
              expiredLoansCount: { $sum: '$isExpired' },
              borrowedBooksCount: { $sum: '$borrowedItemsCount' },
            },
          },
        ])
        .exec(),
      this.fineModel
        .aggregate<{ _id: string; totalFineAmount: number }>([
          { $match: { userId: { $in: userIds } } },
          {
            $group: {
              _id: '$userId',
              totalFineAmount: { $sum: '$amount' },
            },
          },
        ])
        .exec(),
    ]);

    const loanStatsMap = new Map<
      string,
      { borrowedBooksCount: number; expiredLoansCount: number }
    >();
    for (const row of loanStatsRaw) {
      if (row._id) {
        loanStatsMap.set(row._id.toLowerCase(), {
          borrowedBooksCount: Number(row.borrowedBooksCount) || 0,
          expiredLoansCount: Number(row.expiredLoansCount) || 0,
        });
      }
    }

    const fineStatsMap = new Map<string, number>();
    for (const row of fineStatsRaw) {
      if (row._id) {
        fineStatsMap.set(row._id.toLowerCase(), Number(row.totalFineAmount) || 0);
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
    const doc = await this.userModel.findOne({ id }).lean().exec();
    const user = toEntity(User, doc);
    if (!user) return null;
    await this.attachUserRolesBatch([user]);
    return user;
  }

  /**
   * Tìm người dùng theo ID kèm toàn bộ các thực thể liên kết (loans, fines, auditLogs, userRoles)
   * Phục vụ kiểm tra toàn vẹn dữ liệu trước khi xóa
   */
  async findByIdWithRelations(id: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ id }).lean().exec();
    const user = toEntity(User, doc);
    if (!user) return null;

    const [, loanDocs, fineDocs, auditLogDocs] = await Promise.all([
      this.attachUserRolesBatch([user]),
      this.loanModel.find({ userId: user.id }).lean().exec(),
      this.fineModel.find({ userId: user.id }).lean().exec(),
      this.auditLogModel.find({ userId: user.id }).lean().exec(),
    ]);

    user.loans = toEntities(Loan, loanDocs);
    user.fines = toEntities(Fine, fineDocs);
    user.auditLogs = toEntities(AuditLog, auditLogDocs);
    return user;
  }

  /**
   * Tìm người dùng theo tên tài khoản (username)
   */
  async findByUsername(username: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ username }).lean().exec();
    return toEntity(User, doc);
  }

  /**
   * Tìm người dùng theo email
   */
  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ email }).lean().exec();
    return toEntity(User, doc);
  }

  /**
   * Tìm vai trò theo tên hoặc ID
   */
  async findRoleByNameOrId(nameOrId: string): Promise<Role | null> {
    const trimmed = nameOrId.trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        trimmed,
      );
    const filter = isUuid
      ? { $or: [{ id: trimmed }, { name: trimmed }] }
      : { name: trimmed };
    const doc = await this.roleModel.findOne(filter).lean().exec();
    return toEntity(Role, doc);
  }

  /**
   * Sinh mã người dùng kế tiếp theo quy tắc A-xxxx
   */
  async generateNextUserCode(session?: ClientSession): Promise<string> {
    return generateNextAvailableUserCode(this.userModel, session);
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
    const session = await this.connection.startSession();
    try {
      let createdUser: User | null = null;
      await session.withTransaction(async () => {
        let code = userData.code?.trim();
        if (!code) {
          code = await generateNextAvailableUserCode(this.userModel, session);
        } else {
          const existing = await this.userModel
            .findOne({ code })
            .session(session)
            .lean()
            .exec();
          if (existing) {
            code = await generateNextAvailableUserCode(this.userModel, session);
          }
        }

        const user = new User({
          code,
          username: userData.username,
          email: userData.email,
          passwordHash: userData.passwordHash,
          fullName: userData.fullName || undefined,
          phone: userData.phone || null,
          avartarUrl: userData.avartarUrl || null,
          status: userData.status || UserStatus.ACTIVE,
        });
        const userPayload = prepareDocumentForSave(user);
        const [savedDoc] = await this.userModel.create([userPayload], { session });
        const savedUser = toEntity(User, savedDoc) ?? user;

        if (roles.length > 0) {
          const urPayloads = roles.map((role) =>
            prepareDocumentForSave(
              new UserRole({
                userId: savedUser.id,
                roleId: role.id,
              }),
              false,
            ),
          );
          await this.userRoleModel.create(urPayloads, { session, ordered: true });
        }

        await this.attachUserRolesBatch([savedUser], session);
        createdUser = savedUser;
      });

      return createdUser!;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Xóa người dùng theo ID
   */
  async delete(id: string): Promise<boolean> {
    await this.userRoleModel.deleteMany({ userId: id }).exec();
    const result = await this.userModel.deleteOne({ id }).exec();
    return (result.deletedCount ?? 0) > 0;
  }
}
