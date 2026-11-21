import { Injectable } from '@nestjs/common';
import { PermissionRepository } from '../repository/permission.repository.js';
import { PermissionMapper } from '../mapper/permission.mapper.js';
import {
  CreatePermissionDto,
  PermissionResponse,
  UpdatePermissionDto,
} from '../model/permission/permission.dto.js';
import { AppException } from '../common/index.js';
import { TokenHelper } from '../utils/token.helper.js';

@Injectable()
export class PermissionService {
  constructor(
    private readonly permissionRepo: PermissionRepository,
    private readonly permissionMapper: PermissionMapper,
  ) {}

  /**
   * Lấy danh sách quyền hạn theo vai trò người dùng từ JWT Access Token
   */
  async getPermissionsByToken(token: string): Promise<PermissionResponse[]> {
    if (!token || !token.trim()) {
      throw AppException.unauthorized(
        'Vui lòng đăng nhập để truy cập tài nguyên này',
        null,
        'UNAUTHORIZED',
      );
    }

    const payload = TokenHelper.decodeToken(token);
    const userId = payload.userId || payload.sub;

    // 1. Lấy danh sách quyền theo userId từ CSDL (dựa vào bảng user_roles và role_permissions)
    if (userId) {
      const userPermissions = await this.permissionRepo.findByUserId(userId);
      if (userPermissions && userPermissions.length > 0) {
        return this.permissionMapper.toResponseList(userPermissions);
      }
    }

    // 2. Fallback lấy theo danh sách roles trong JWT Token từ CSDL
    if (payload.roles && payload.roles.length > 0) {
      const rolePermissions = await this.permissionRepo.findByRoleNames(payload.roles);
      return this.permissionMapper.toResponseList(rolePermissions);
    }

    return [];
  }

  /**
   * Lấy danh sách tất cả các quyền hạn (không phân trang), map sang PermissionResponse[]
   */
  async getAllPermissions(): Promise<PermissionResponse[]> {
    const permissions = await this.permissionRepo.findAll();
    return this.permissionMapper.toResponseList(permissions);
  }

  /**
   * Lấy danh sách quyền hạn theo roleId, map sang PermissionResponse[]
   */
  async getPermissionsByRoleId(roleId: string): Promise<PermissionResponse[]> {
    if (!roleId || !roleId.trim()) {
      throw AppException.badRequest(
        'Mã định danh vai trò (roleId) không hợp lệ',
        { roleId },
        'INVALID_ROLE_ID',
      );
    }

    const trimmedRoleId = roleId.trim();
    const role = await this.permissionRepo.findRoleById(trimmedRoleId);
    if (!role) {
      throw AppException.notFound(
        `Không tìm thấy vai trò với ID: ${trimmedRoleId}`,
        { roleId: trimmedRoleId },
        'ROLE_NOT_FOUND',
      );
    }

    const permissions = await this.permissionRepo.findByRoleId(trimmedRoleId);
    return this.permissionMapper.toResponseList(permissions);
  }

  /**
   * Lấy chi tiết quyền hạn theo ID, map sang PermissionResponse
   */
  async getPermissionById(id: string): Promise<PermissionResponse> {
    if (!id || !id.trim()) {
      throw AppException.badRequest(
        'Mã định danh quyền hạn (id) không hợp lệ',
        { id },
        'INVALID_PERMISSION_ID',
      );
    }

    const permission = await this.permissionRepo.findById(id.trim());
    if (!permission) {
      throw AppException.notFound(
        `Không tìm thấy quyền hạn với ID: ${id}`,
        { id },
        'PERMISSION_NOT_FOUND',
      );
    }
    return this.permissionMapper.toResponse(permission);
  }

  /**
   * Thêm mới quyền hạn (code, description)
   */
  async createPermission(dto: CreatePermissionDto): Promise<PermissionResponse> {
    if (!dto.code || !dto.code.trim()) {
      throw AppException.badRequest(
        'Mã quyền hạn không được để trống',
        { field: 'code' },
        'PERMISSION_CODE_REQUIRED',
      );
    }

    const trimmedCode = dto.code.trim().toUpperCase();
    if (trimmedCode.length < 2 || trimmedCode.length > 100) {
      throw AppException.badRequest(
        'Mã quyền hạn phải có độ dài từ 2 đến 100 ký tự',
        { field: 'code' },
        'INVALID_PERMISSION_CODE_LENGTH',
      );
    }

    const existing = await this.permissionRepo.findByCode(trimmedCode);
    if (existing) {
      throw AppException.conflict(
        `Mã quyền hạn '${trimmedCode}' đã tồn tại trong hệ thống`,
        { code: trimmedCode },
        'PERMISSION_CODE_CONFLICT',
      );
    }

    const permission = this.permissionMapper.toEntity(dto);
    permission.code = trimmedCode;
    if (dto.description !== undefined) {
      permission.description = dto.description?.trim() || null;
    }

    const savedPermission = await this.permissionRepo.save(permission);
    return this.permissionMapper.toResponse(savedPermission);
  }

  /**
   * Cập nhật thông tin quyền hạn theo ID
   */
  async updatePermission(id: string, dto: UpdatePermissionDto): Promise<PermissionResponse> {
    if (!id || !id.trim()) {
      throw AppException.badRequest(
        'Mã định danh quyền hạn (id) không hợp lệ',
        { id },
        'INVALID_PERMISSION_ID',
      );
    }

    const permission = await this.permissionRepo.findById(id.trim());
    if (!permission) {
      throw AppException.notFound(
        `Không tìm thấy quyền hạn với ID: ${id}`,
        { id },
        'PERMISSION_NOT_FOUND',
      );
    }

    if (dto.code !== undefined) {
      const trimmedCode = dto.code.trim().toUpperCase();
      if (!trimmedCode) {
        throw AppException.badRequest(
          'Mã quyền hạn không hợp lệ',
          { field: 'code' },
          'INVALID_PERMISSION_CODE',
        );
      }

      if (trimmedCode !== permission.code) {
        const existing = await this.permissionRepo.findByCode(trimmedCode);
        if (existing && existing.id !== permission.id) {
          throw AppException.conflict(
            `Mã quyền hạn '${trimmedCode}' đã tồn tại trong hệ thống`,
            { code: trimmedCode },
            'PERMISSION_CODE_CONFLICT',
          );
        }
      }
      permission.code = trimmedCode;
    }

    if (dto.description !== undefined) {
      permission.description = dto.description?.trim() || null;
    }

    permission.updatedAt = new Date();
    const updatedPermission = await this.permissionRepo.save(permission);
    return this.permissionMapper.toResponse(updatedPermission);
  }

  /**
   * Xóa quyền hạn theo ID
   */
  async deletePermission(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw AppException.badRequest(
        'Mã định danh quyền hạn (id) không hợp lệ',
        { id },
        'INVALID_PERMISSION_ID',
      );
    }

    const permission = await this.permissionRepo.findByIdWithRolePermissions(id.trim());
    if (!permission) {
      throw AppException.notFound(
        `Không tìm thấy quyền hạn với ID: ${id}`,
        { id },
        'PERMISSION_NOT_FOUND',
      );
    }

    if (permission.rolePermissions && permission.rolePermissions.length > 0) {
      throw AppException.badRequest(
        `Không thể xóa quyền hạn vì đang được gán cho ${permission.rolePermissions.length} vai trò`,
        { id, rolePermissionCount: permission.rolePermissions.length },
        'PERMISSION_HAS_ROLE_ASSOCIATIONS',
      );
    }

    const isDeleted = await this.permissionRepo.delete(id.trim());
    if (!isDeleted) {
      throw AppException.badRequest(
        `Xóa quyền hạn thất bại với ID: ${id}`,
        { id },
        'DELETE_PERMISSION_FAILED',
      );
    }
  }
}
