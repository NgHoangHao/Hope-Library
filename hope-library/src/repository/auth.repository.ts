import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Connection, Model } from 'mongoose';
import { User, UserStatus } from '../model/user/user.entity.js';
import { Role } from '../model/role/role.entity.js';
import { UserRole } from '../model/user-role/user-role.entity.js';
import { Permission } from '../model/permission/permission.entity.js';
import { RolePermission } from '../model/role-permission/role-permission.entity.js';
import { Navigation } from '../model/navigation/navigation.entity.js';
import { RoleNavigation } from '../model/role-navigation/role-navigation.entity.js';
import { generateNextAvailableUserCode } from '../utils/user-code.util.js';
import {
  prepareDocumentForSave,
  toEntities,
  toEntity,
} from '../database/mongo.helper.js';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
    @InjectModel(UserRole.name)
    private readonly userRoleModel: Model<UserRole>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel: Model<RolePermission>,
    @InjectModel(Navigation.name)
    private readonly navigationModel: Model<Navigation>,
    @InjectModel(RoleNavigation.name)
    private readonly roleNavigationModel: Model<RoleNavigation>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  private async attachUserRoles(
    user: User | null,
    session?: ClientSession,
  ): Promise<User | null> {
    if (!user) return null;

    const urQuery = this.userRoleModel.find({ userId: user.id }).lean();
    if (session) urQuery.session(session);
    const urDocs = await urQuery.exec();
    const userRoles = toEntities(UserRole, urDocs);

    const roleIds = [...new Set(userRoles.map((ur) => ur.roleId).filter(Boolean))];
    if (roleIds.length > 0) {
      const roleQuery = this.roleModel.find({ id: { $in: roleIds } }).lean();
      if (session) roleQuery.session(session);
      const roleDocs = await roleQuery.exec();
      const roleMap = new Map(
        toEntities(Role, roleDocs).map((r) => [r.id, r]),
      );
      for (const ur of userRoles) {
        ur.role = roleMap.get(ur.roleId);
      }
    }

    user.userRoles = userRoles;
    return user;
  }

  /**
   * Tìm người dùng theo email (kèm thông tin vai trò)
   */
  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ email }).lean().exec();
    return this.attachUserRoles(toEntity(User, doc));
  }

  /**
   * Tìm người dùng theo username (kèm thông tin vai trò)
   */
  async findByUsername(username: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ username }).lean().exec();
    return this.attachUserRoles(toEntity(User, doc));
  }

  /**
   * Tìm người dùng theo id (kèm thông tin vai trò)
   */
  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ id }).lean().exec();
    return this.attachUserRoles(toEntity(User, doc));
  }

  /**
   * Lưu hoặc cập nhật thông tin người dùng trong CSDL
   */
  async saveUser(user: User): Promise<User> {
    const payload = prepareDocumentForSave(user);
    const saved = await this.userModel
      .findOneAndUpdate(
        { id: payload.id },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    const hydrated = toEntity(User, saved) ?? user;
    hydrated.userRoles = user.userRoles;
    return hydrated;
  }

  /**
   * Tìm vai trò theo tên (ví dụ: 'BORROWER')
   */
  async findRoleByName(name: string): Promise<Role | null> {
    const doc = await this.roleModel.findOne({ name }).lean().exec();
    return toEntity(Role, doc);
  }

  /**
   * Tạo vai trò mới nếu chưa có trong DB
   */
  async createRole(name: string, description?: string): Promise<Role> {
    const role = new Role({
      name,
      description: description || null,
    });
    const payload = prepareDocumentForSave(role);
    const [created] = await this.roleModel.create([payload]);
    return toEntity(Role, created) ?? role;
  }

  /**
   * Sinh mã người dùng kế tiếp theo quy tắc A-xxxx
   */
  async generateNextUserCode(session?: ClientSession): Promise<string> {
    return generateNextAvailableUserCode(this.userModel, session);
  }

  /**
   * Tạo tài khoản người dùng và gán vai trò mặc định trong transaction
   */
  async createUserWithRole(
    userData: {
      username: string;
      email: string;
      passwordHash: string;
      fullName?: string | null;
      phone?: string | null;
      code?: string | null;
      status?: UserStatus;
    },
    role: Role,
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
          status: userData.status || UserStatus.ACTIVE,
        });
        const userPayload = prepareDocumentForSave(user);
        const [savedDoc] = await this.userModel.create([userPayload], { session });
        const savedUser = toEntity(User, savedDoc) ?? user;

        const userRole = new UserRole({
          userId: savedUser.id,
          roleId: role.id,
          assignedBy: 'SYSTEM_REGISTER',
        });
        const urPayload = prepareDocumentForSave(userRole, false);
        await this.userRoleModel.create([urPayload], { session });

        createdUser = await this.attachUserRoles(savedUser, session);
      });

      return createdUser!;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Tìm vai trò theo id
   */
  async findRoleById(id: string): Promise<Role | null> {
    const doc = await this.roleModel.findOne({ id }).lean().exec();
    return toEntity(Role, doc);
  }

  /**
   * Tìm quyền hạn theo id
   */
  async findPermissionById(id: string): Promise<Permission | null> {
    const doc = await this.permissionModel.findOne({ id }).lean().exec();
    return toEntity(Permission, doc);
  }

  /**
   * Tìm liên kết RolePermission theo roleId và permissionId
   */
  async findRolePermission(roleId: string, permissionId: string): Promise<RolePermission | null> {
    const doc = await this.rolePermissionModel
      .findOne({ roleId, permissionId })
      .lean()
      .exec();
    const rp = toEntity(RolePermission, doc);
    if (!rp) return null;

    const [roleDoc, permDoc] = await Promise.all([
      this.roleModel.findOne({ id: rp.roleId }).lean().exec(),
      this.permissionModel.findOne({ id: rp.permissionId }).lean().exec(),
    ]);
    rp.role = toEntity(Role, roleDoc) ?? undefined;
    rp.permission = toEntity(Permission, permDoc) ?? undefined;
    return rp;
  }

  /**
   * Lưu liên kết RolePermission vào CSDL
   */
  async saveRolePermission(rolePermission: RolePermission): Promise<RolePermission> {
    const payload = prepareDocumentForSave(rolePermission, false);
    const saved = await this.rolePermissionModel
      .findOneAndUpdate(
        { roleId: rolePermission.roleId, permissionId: rolePermission.permissionId },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return toEntity(RolePermission, saved) ?? rolePermission;
  }

  /**
   * Tìm điều hướng theo id
   */
  async findNavigationById(id: string): Promise<Navigation | null> {
    const doc = await this.navigationModel.findOne({ id }).lean().exec();
    return toEntity(Navigation, doc);
  }

  /**
   * Tìm liên kết RoleNavigation theo roleId và navigationId
   */
  async findRoleNavigation(roleId: string, navigationId: string): Promise<RoleNavigation | null> {
    const doc = await this.roleNavigationModel
      .findOne({ roleId, navigationId })
      .lean()
      .exec();
    const rn = toEntity(RoleNavigation, doc);
    if (!rn) return null;

    const [roleDoc, navDoc] = await Promise.all([
      this.roleModel.findOne({ id: rn.roleId }).lean().exec(),
      this.navigationModel.findOne({ id: rn.navigationId }).lean().exec(),
    ]);
    rn.role = toEntity(Role, roleDoc) ?? undefined;
    rn.navigation = toEntity(Navigation, navDoc) ?? undefined;
    return rn;
  }

  /**
   * Lưu liên kết RoleNavigation vào CSDL
   */
  async saveRoleNavigation(roleNavigation: RoleNavigation): Promise<RoleNavigation> {
    const payload = prepareDocumentForSave(roleNavigation, false);
    const saved = await this.roleNavigationModel
      .findOneAndUpdate(
        { roleId: roleNavigation.roleId, navigationId: roleNavigation.navigationId },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return toEntity(RoleNavigation, saved) ?? roleNavigation;
  }

  /**
   * Xóa liên kết RolePermission theo roleId và permissionId
   */
  async deleteRolePermission(roleId: string, permissionId: string): Promise<boolean> {
    const result = await this.rolePermissionModel
      .deleteOne({ roleId, permissionId })
      .exec();
    return (result.deletedCount ?? 0) > 0;
  }

  /**
   * Xóa liên kết RoleNavigation theo roleId và navigationId
   */
  async deleteRoleNavigation(roleId: string, navigationId: string): Promise<boolean> {
    const result = await this.roleNavigationModel
      .deleteOne({ roleId, navigationId })
      .exec();
    return (result.deletedCount ?? 0) > 0;
  }
}
