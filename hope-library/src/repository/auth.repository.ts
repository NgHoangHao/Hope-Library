import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User, UserStatus } from '../model/user/user.entity.js';
import { Role } from '../model/role/role.entity.js';
import { UserRole } from '../model/user-role/user-role.entity.js';
import { Permission } from '../model/permission/permission.entity.js';
import { RolePermission } from '../model/role-permission/role-permission.entity.js';
import { Navigation } from '../model/navigation/navigation.entity.js';
import { RoleNavigation } from '../model/role-navigation/role-navigation.entity.js';
import { generateNextAvailableUserCode } from '../utils/user-code.util.js';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(Navigation)
    private readonly navigationRepo: Repository<Navigation>,
    @InjectRepository(RoleNavigation)
    private readonly roleNavigationRepo: Repository<RoleNavigation>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Tìm người dùng theo email (kèm thông tin vai trò)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      relations: {
        userRoles: {
          role: true,
        },
      },
    });
  }

  /**
   * Tìm người dùng theo username (kèm thông tin vai trò)
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { username },
      relations: {
        userRoles: {
          role: true,
        },
      },
    });
  }

  /**
   * Tìm người dùng theo id (kèm thông tin vai trò)
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
   * Lưu hoặc cập nhật thông tin người dùng trong CSDL
   */
  async saveUser(user: User): Promise<User> {
    return this.userRepo.save(user);
  }

  /**
   * Tìm vai trò theo tên (ví dụ: 'BORROWER')
   */
  async findRoleByName(name: string): Promise<Role | null> {
    return this.roleRepo.findOne({
      where: { name },
    });
  }

  /**
   * Tạo vai trò mới nếu chưa có trong DB
   */
  async createRole(name: string, description?: string): Promise<Role> {
    const role = this.roleRepo.create({
      name,
      description: description || null,
    });
    return this.roleRepo.save(role);
  }

  /**
   * Sinh mã người dùng kế tiếp theo quy tắc A-xxxx
   */
  async generateNextUserCode(manager?: EntityManager): Promise<string> {
    const target = manager ? manager.getRepository(User) : this.userRepo;
    return generateNextAvailableUserCode(target);
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
        status: userData.status || UserStatus.ACTIVE,
      });

      const savedUser = await manager.save(User, user);

      const userRole = manager.create(UserRole, {
        userId: savedUser.id,
        roleId: role.id,
        assignedBy: 'SYSTEM_REGISTER',
      });

      await manager.save(UserRole, userRole);

      // Nạp lại user với đầy đủ relations để AutoMapper xử lý
      return manager.findOneOrFail(User, {
        where: { id: savedUser.id },
        relations: {
          userRoles: {
            role: true,
          },
        },
      });
    });
  }

  /**
   * Tìm vai trò theo id
   */
  async findRoleById(id: string): Promise<Role | null> {
    return this.roleRepo.findOne({
      where: { id },
    });
  }

  /**
   * Tìm quyền hạn theo id
   */
  async findPermissionById(id: string): Promise<Permission | null> {
    return this.permissionRepo.findOne({
      where: { id },
    });
  }

  /**
   * Tìm liên kết RolePermission theo roleId và permissionId
   */
  async findRolePermission(roleId: string, permissionId: string): Promise<RolePermission | null> {
    return this.rolePermissionRepo.findOne({
      where: { roleId, permissionId },
      relations: {
        role: true,
        permission: true,
      },
    });
  }

  /**
   * Lưu liên kết RolePermission vào CSDL
   */
  async saveRolePermission(rolePermission: RolePermission): Promise<RolePermission> {
    return this.rolePermissionRepo.save(rolePermission);
  }

  /**
   * Tìm điều hướng theo id
   */
  async findNavigationById(id: string): Promise<Navigation | null> {
    return this.navigationRepo.findOne({
      where: { id },
    });
  }

  /**
   * Tìm liên kết RoleNavigation theo roleId và navigationId
   */
  async findRoleNavigation(roleId: string, navigationId: string): Promise<RoleNavigation | null> {
    return this.roleNavigationRepo.findOne({
      where: { roleId, navigationId },
      relations: {
        role: true,
        navigation: true,
      },
    });
  }

  /**
   * Lưu liên kết RoleNavigation vào CSDL
   */
  async saveRoleNavigation(roleNavigation: RoleNavigation): Promise<RoleNavigation> {
    return this.roleNavigationRepo.save(roleNavigation);
  }

  /**
   * Xóa liên kết RolePermission theo roleId và permissionId
   */
  async deleteRolePermission(roleId: string, permissionId: string): Promise<boolean> {
    const result = await this.rolePermissionRepo.delete({ roleId, permissionId });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Xóa liên kết RoleNavigation theo roleId và navigationId
   */
  async deleteRoleNavigation(roleId: string, navigationId: string): Promise<boolean> {
    const result = await this.roleNavigationRepo.delete({ roleId, navigationId });
    return (result.affected ?? 0) > 0;
  }
}

