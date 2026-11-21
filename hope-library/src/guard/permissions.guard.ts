import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorator/permissions.decorator.js';
import { TokenHelper } from '../utils/token.helper.js';
import { AppException } from '../common/index.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
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

    // 3. Lấy danh sách các mã quyền (permission code) mà người dùng sở hữu từ CSDL
    let userPermissionCodes: string[] = [];
    let hasUserRolesInDb = false;
    const userId = payload.userId || payload.sub;

    if (userId) {
      const userRolesCount = await this.dataSource
        .createQueryBuilder()
        .select('ur.roleId', 'roleId')
        .from('user_roles', 'ur')
        .where('ur.userId = :userId', { userId })
        .getRawMany<{ roleId: string }>();

      hasUserRolesInDb = userRolesCount.length > 0;

      if (hasUserRolesInDb) {
        const rawPermissions = await this.dataSource
          .createQueryBuilder()
          .select('p.code', 'code')
          .from('permissions', 'p')
          .innerJoin('role_permissions', 'rp', 'rp.permissionId = p.id')
          .innerJoin('user_roles', 'ur', 'ur.roleId = rp.roleId')
          .where('ur.userId = :userId', { userId })
          .getRawMany<{ code: string }>();

        userPermissionCodes = rawPermissions
          .map((row) => row.code?.trim().toUpperCase())
          .filter((code): code is string => Boolean(code));
      }
    }

    // Fallback: chỉ khi userId không có liên kết user_roles trong DB mới kiểm tra theo danh sách vai trò (roles) trong token
    if (!hasUserRolesInDb && userPermissionCodes.length === 0 && payload.roles && payload.roles.length > 0) {
      const rawPermissions = await this.dataSource
        .createQueryBuilder()
        .select('p.code', 'code')
        .from('permissions', 'p')
        .innerJoin('role_permissions', 'rp', 'rp.permissionId = p.id')
        .innerJoin('roles', 'r', 'r.id = rp.roleId')
        .where('r.name IN (:...roles)', { roles: payload.roles })
        .getRawMany<{ code: string }>();

      userPermissionCodes = rawPermissions
        .map((row) => row.code?.trim().toUpperCase())
        .filter((code): code is string => Boolean(code));
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
