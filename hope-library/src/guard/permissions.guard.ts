import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorator/permissions.decorator.js';
import { TokenHelper } from '../utils/token.helper.js';
import { AppException } from '../common/index.js';
import { UserRole } from '../model/user-role/user-role.entity.js';
import { Role } from '../model/role/role.entity.js';
import { RolePermission } from '../model/role-permission/role-permission.entity.js';
import { Permission } from '../model/permission/permission.entity.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(UserRole.name)
    private readonly userRoleModel: Model<UserRole>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel: Model<RolePermission>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu endpoint không yêu cầu quyền hạn nào -> cho phép đi qua
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // 1. Trích xuất token từ Authorization Header hoặc Cookie
    let token: string;
    try {
      token = TokenHelper.extractTokenFromRequest(request);
    } catch {
      throw AppException.unauthorized(
        'Vui lòng đăng nhập để truy cập tài nguyên này',
        null,
        'UNAUTHORIZED',
      );
    }

    // 2. Giải mã Access Token
    const payload = TokenHelper.decodeToken(token);
    (request as any).user = payload;

    // 3. Lấy danh sách các mã quyền (permission code) mà người dùng sở hữu từ MongoDB
    let userPermissionCodes: string[] = [];
    let hasUserRolesInDb = false;
    const userId = payload.userId || payload.sub;

    if (userId) {
      const userRoles = await this.userRoleModel
        .find({ userId }, { roleId: 1 })
        .lean()
        .exec();

      const roleIds = userRoles.map((ur) => ur.roleId).filter(Boolean);
      hasUserRolesInDb = roleIds.length > 0;

      if (hasUserRolesInDb) {
        const rolePermissions = await this.rolePermissionModel
          .find({ roleId: { $in: roleIds } }, { permissionId: 1 })
          .lean()
          .exec();

        const permissionIds = [
          ...new Set(rolePermissions.map((rp) => rp.permissionId).filter(Boolean)),
        ];

        if (permissionIds.length > 0) {
          const permissions = await this.permissionModel
            .find({ id: { $in: permissionIds } }, { code: 1 })
            .lean()
            .exec();

          userPermissionCodes = permissions
            .map((p) => p.code?.trim().toUpperCase())
            .filter((code): code is string => Boolean(code));
        }
      }
    }

    // Fallback: chỉ khi userId không có liên kết user_roles trong DB mới kiểm tra theo danh sách vai trò (roles) trong token
    if (
      !hasUserRolesInDb &&
      userPermissionCodes.length === 0 &&
      payload.roles &&
      payload.roles.length > 0
    ) {
      const roles = await this.roleModel
        .find({ name: { $in: payload.roles } }, { id: 1 })
        .lean()
        .exec();
      const roleIds = roles.map((r) => r.id).filter(Boolean);

      if (roleIds.length > 0) {
        const rolePermissions = await this.rolePermissionModel
          .find({ roleId: { $in: roleIds } }, { permissionId: 1 })
          .lean()
          .exec();
        const permissionIds = [
          ...new Set(rolePermissions.map((rp) => rp.permissionId).filter(Boolean)),
        ];

        if (permissionIds.length > 0) {
          const permissions = await this.permissionModel
            .find({ id: { $in: permissionIds } }, { code: 1 })
            .lean()
            .exec();

          userPermissionCodes = permissions
            .map((p) => p.code?.trim().toUpperCase())
            .filter((code): code is string => Boolean(code));
        }
      }
    }

    const permissionSet = new Set(userPermissionCodes);

    // 4. Kiểm tra người dùng có quyền hợp lệ hay không
    const hasPermission = requiredPermissions.some((perm) =>
      permissionSet.has(perm.trim().toUpperCase()),
    );
    if (!hasPermission) {
      throw AppException.forbidden(
        'Bạn không có quyền thực hiện thao tác này',
        {
          requiredPermissions,
          userPermissions: Array.from(permissionSet),
        },
        'FORBIDDEN_RESOURCE',
      );
    }

    return true;
  }
}
