import { Injectable } from '@nestjs/common';
import { NavigationRepository } from '../repository/navigation.repository.js';
import { NavigationMapper } from '../mapper/navigation.mapper.js';
import {
  CreateNavigationDto,
  NavigationResponse,
  NavigationTreeResponse,
  UpdateNavigationDto,
} from '../model/navigation/navigation.dto.js';
import { AppException } from '../common/index.js';
import { TokenHelper } from '../utils/index.js';
import type { JwtPayload } from '../model/user/user.dto.js';

@Injectable()
export class NavigationService {
  constructor(
    private readonly navigationRepo: NavigationRepository,
    private readonly navigationMapper: NavigationMapper,
  ) {}

  /**
   * Lấy toàn bộ danh sách điều hướng (phẳng), map sang NavigationResponse[]
   */
  async getAllNavigations(): Promise<NavigationResponse[]> {
    const navigations = await this.navigationRepo.findAll();
    return this.navigationMapper.toResponseList(navigations);
  }

  /**
   * Lấy cấu trúc cây điều hướng (hierarchical tree), map sang NavigationTreeResponse[]
   */
  async getNavigationTree(): Promise<NavigationTreeResponse[]> {
    const rootNavigations = await this.navigationRepo.findRootNavigations();
    return this.navigationMapper.toTreeResponseList(rootNavigations);
  }

  /**
   * Lấy cấu trúc cây điều hướng theo vai trò từ token
   * Ưu tiên 1 role theo thứ tự: ADMIN > LIBRARIAN > BORROWER
   */
  async getNavigationTreeByToken(token: string): Promise<NavigationTreeResponse[]> {
    const payload = TokenHelper.decodeToken(token);
    const roleId = await this.getPrioritizedRoleIdFromPayload(payload);
    return this.getNavigationTreeByRoleId(roleId);
  }

  /**
   * Xác định roleId ưu tiên từ JWT payload hoặc thông tin vai trò của người dùng
   * Thứ tự ưu tiên: ADMIN > LIBRARIAN > BORROWER
   */
  async getPrioritizedRoleIdFromPayload(payload: JwtPayload): Promise<string> {
    const tokenRoles = payload.roles || [];
    const prioritizedRoleName = this.determinePrioritizedRoleName(tokenRoles);

    if (prioritizedRoleName) {
      const role = await this.navigationRepo.findRoleByName(prioritizedRoleName);
      if (role) {
        return role.id;
      }
    }

    const userId = payload.userId || payload.sub;
    if (userId) {
      const userRoles = await this.navigationRepo.findUserRolesByUserId(userId);
      if (userRoles && userRoles.length > 0) {
        const dbRoleNames = userRoles
          .map((ur) => ur.role?.name)
          .filter((name): name is string => Boolean(name));
        const selectedDbRoleName = this.determinePrioritizedRoleName(dbRoleNames);

        if (selectedDbRoleName) {
          const matched = userRoles.find(
            (ur) => ur.role?.name?.toUpperCase() === selectedDbRoleName.toUpperCase(),
          );
          if (matched) {
            return matched.roleId;
          }
        }

        return userRoles[0].roleId;
      }
    }

    throw AppException.forbidden(
      'Tài khoản người dùng chưa được gán vai trò hợp lệ trong hệ thống',
      { roles: tokenRoles },
      'USER_HAS_NO_ROLE',
    );
  }

  /**
   * Xác định 1 tên vai trò ưu tiên nhất từ danh sách vai trò
   * Thứ tự ưu tiên: ADMIN > LIBRARIAN > BORROWER
   */
  determinePrioritizedRoleName(roles: string[]): string | null {
    if (!roles || roles.length === 0) {
      return null;
    }

    const normalizedRoles = roles
      .filter((r): r is string => Boolean(r && typeof r === 'string'))
      .map((r) => r.trim().toUpperCase());

    const PRIORITY_ORDER = ['ADMIN', 'LIBRARIAN', 'BORROWER'];

    for (const priority of PRIORITY_ORDER) {
      if (normalizedRoles.includes(priority)) {
        return priority;
      }
    }

    return normalizedRoles[0] || null;
  }

  /**
   * Lấy cấu trúc cây điều hướng theo vai trò (roleId), map sang NavigationTreeResponse[]
   */
  async getNavigationTreeByRoleId(roleId: string): Promise<NavigationTreeResponse[]> {
    if (!roleId || !roleId.trim()) {
      throw AppException.badRequest(
        'Mã định danh vai trò (roleId) không hợp lệ',
        { roleId },
        'INVALID_ROLE_ID',
      );
    }

    const trimmedRoleId = roleId.trim();
    const role = await this.navigationRepo.findRoleById(trimmedRoleId);
    if (!role) {
      throw AppException.notFound(
        `Không tìm thấy vai trò với ID: ${trimmedRoleId}`,
        { roleId: trimmedRoleId },
        'ROLE_NOT_FOUND',
      );
    }

    const navigations = await this.navigationRepo.findByRoleId(trimmedRoleId);
    if (!navigations || navigations.length === 0) {
      return [];
    }

    // Tự động truy vấn bổ sung menu cha nếu chưa được gán trực tiếp vào vai trò
    const existingIds = new Set(navigations.map((n) => n.id));
    let allNavigations = [...navigations];
    let missingParentIds = Array.from(
      new Set(
        allNavigations
          .map((n) => n.parentId)
          .filter((p): p is string => Boolean(p && !existingIds.has(p))),
      ),
    );

    while (missingParentIds.length > 0) {
      const parents = await this.navigationRepo.findByIds(missingParentIds);
      if (parents.length === 0) break;
      for (const p of parents) {
        existingIds.add(p.id);
        allNavigations.push(p);
      }
      missingParentIds = Array.from(
        new Set(
          parents
            .map((p) => p.parentId)
            .filter((p): p is string => Boolean(p && !existingIds.has(p))),
        ),
      );
    }

    // Sắp xếp theo sortOrder ASC, createdAt ASC
    allNavigations.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    return this.navigationMapper.toTreeResponseListFromFlatList(allNavigations);
  }

  /**
   * Lấy danh sách điều hướng (phẳng) theo vai trò (roleId), map sang NavigationResponse[]
   */
  async getNavigationsByRoleId(roleId: string): Promise<NavigationResponse[]> {
    if (!roleId || !roleId.trim()) {
      throw AppException.badRequest(
        'Mã định danh vai trò (roleId) không hợp lệ',
        { roleId },
        'INVALID_ROLE_ID',
      );
    }

    const trimmedRoleId = roleId.trim();
    const role = await this.navigationRepo.findRoleById(trimmedRoleId);
    if (!role) {
      throw AppException.notFound(
        `Không tìm thấy vai trò với ID: ${trimmedRoleId}`,
        { roleId: trimmedRoleId },
        'ROLE_NOT_FOUND',
      );
    }

    const navigations = await this.navigationRepo.findByRoleId(trimmedRoleId);
    return this.navigationMapper.toResponseList(navigations);
  }

  /**
   * Lấy chi tiết điều hướng theo ID, map sang NavigationResponse
   */
  async getNavigationById(id: string): Promise<NavigationResponse> {
    if (!id || !id.trim()) {
      throw AppException.badRequest(
        'Mã định danh điều hướng (id) không hợp lệ',
        { id },
        'INVALID_NAVIGATION_ID',
      );
    }

    const navigation = await this.navigationRepo.findById(id.trim());
    if (!navigation) {
      throw AppException.notFound(
        `Không tìm thấy điều hướng với ID: ${id}`,
        { id },
        'NAVIGATION_NOT_FOUND',
      );
    }

    return this.navigationMapper.toResponse(navigation);
  }

  /**
   * Thêm mới điều hướng
   */
  async createNavigation(dto: CreateNavigationDto): Promise<NavigationResponse> {
    if (!dto.code || !dto.code.trim()) {
      throw AppException.badRequest(
        'Mã điều hướng không được để trống',
        { field: 'code' },
        'NAVIGATION_CODE_REQUIRED',
      );
    }

    const trimmedCode = dto.code.trim().toUpperCase();
    if (trimmedCode.length < 2 || trimmedCode.length > 100) {
      throw AppException.badRequest(
        'Mã điều hướng phải có độ dài từ 2 đến 100 ký tự',
        { field: 'code' },
        'INVALID_NAVIGATION_CODE_LENGTH',
      );
    }

    if (!dto.name || !dto.name.trim()) {
      throw AppException.badRequest(
        'Tên điều hướng không được để trống',
        { field: 'name' },
        'NAVIGATION_NAME_REQUIRED',
      );
    }

    const trimmedName = dto.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 255) {
      throw AppException.badRequest(
        'Tên điều hướng phải có độ dài từ 2 đến 255 ký tự',
        { field: 'name' },
        'INVALID_NAVIGATION_NAME_LENGTH',
      );
    }

    const existingCode = await this.navigationRepo.findByCode(trimmedCode);
    if (existingCode) {
      throw AppException.conflict(
        `Mã điều hướng '${trimmedCode}' đã tồn tại trong hệ thống`,
        { code: trimmedCode },
        'NAVIGATION_CODE_CONFLICT',
      );
    }

    let parentId: string | null = null;
    if (dto.parentId && dto.parentId.trim()) {
      parentId = dto.parentId.trim();
      const parent = await this.navigationRepo.findById(parentId);
      if (!parent) {
        throw AppException.notFound(
          `Không tìm thấy điều hướng cha với ID: ${parentId}`,
          { parentId },
          'PARENT_NAVIGATION_NOT_FOUND',
        );
      }
    }

    const navigation = this.navigationMapper.toEntity(dto);
    navigation.code = trimmedCode;
    navigation.name = trimmedName;
    navigation.path = dto.path !== undefined ? (dto.path?.trim() || null) : null;
    navigation.parentId = parentId;
    navigation.icon = dto.icon !== undefined ? (dto.icon?.trim() || null) : null;
    navigation.sortOrder = dto.sortOrder !== undefined ? Number(dto.sortOrder) : 0;
    navigation.isVisible = dto.isVisible !== undefined ? Boolean(dto.isVisible) : true;
    navigation.isActive = dto.isActive !== undefined ? Boolean(dto.isActive) : true;

    const savedNavigation = await this.navigationRepo.save(navigation);
    return this.navigationMapper.toResponse(savedNavigation);
  }

  /**
   * Cập nhật thông tin điều hướng theo ID
   */
  async updateNavigation(id: string, dto: UpdateNavigationDto): Promise<NavigationResponse> {
    if (!id || !id.trim()) {
      throw AppException.badRequest(
        'Mã định danh điều hướng (id) không hợp lệ',
        { id },
        'INVALID_NAVIGATION_ID',
      );
    }

    const trimmedId = id.trim();
    const navigation = await this.navigationRepo.findById(trimmedId);
    if (!navigation) {
      throw AppException.notFound(
        `Không tìm thấy điều hướng với ID: ${trimmedId}`,
        { id: trimmedId },
        'NAVIGATION_NOT_FOUND',
      );
    }

    if (dto.code !== undefined) {
      const trimmedCode = dto.code.trim().toUpperCase();
      if (!trimmedCode) {
        throw AppException.badRequest(
          'Mã điều hướng không được để trống',
          { field: 'code' },
          'INVALID_NAVIGATION_CODE',
        );
      }

      if (trimmedCode !== navigation.code) {
        const existing = await this.navigationRepo.findByCode(trimmedCode);
        if (existing && existing.id !== navigation.id) {
          throw AppException.conflict(
            `Mã điều hướng '${trimmedCode}' đã tồn tại trong hệ thống`,
            { code: trimmedCode },
            'NAVIGATION_CODE_CONFLICT',
          );
        }
      }
      navigation.code = trimmedCode;
    }

    if (dto.name !== undefined) {
      const trimmedName = dto.name.trim();
      if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 255) {
        throw AppException.badRequest(
          'Tên điều hướng phải có độ dài từ 2 đến 255 ký tự',
          { field: 'name' },
          'INVALID_NAVIGATION_NAME',
        );
      }
      navigation.name = trimmedName;
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === null || !dto.parentId.trim()) {
        navigation.parentId = null;
      } else {
        const parentId = dto.parentId.trim();
        if (parentId === navigation.id) {
          throw AppException.badRequest(
            'Điều hướng cha không thể là chính nó',
            { id: navigation.id, parentId },
            'INVALID_PARENT_NAVIGATION',
          );
        }

        const parent = await this.navigationRepo.findById(parentId);
        if (!parent) {
          throw AppException.notFound(
            `Không tìm thấy điều hướng cha với ID: ${parentId}`,
            { parentId },
            'PARENT_NAVIGATION_NOT_FOUND',
          );
        }
        navigation.parentId = parentId;
      }
    }

    if (dto.path !== undefined) {
      navigation.path = dto.path?.trim() || null;
    }

    if (dto.icon !== undefined) {
      navigation.icon = dto.icon?.trim() || null;
    }

    if (dto.sortOrder !== undefined) {
      navigation.sortOrder = Number(dto.sortOrder);
    }

    if (dto.isVisible !== undefined) {
      navigation.isVisible = Boolean(dto.isVisible);
    }

    if (dto.isActive !== undefined) {
      navigation.isActive = Boolean(dto.isActive);
    }

    navigation.updatedAt = new Date();
    const updatedNavigation = await this.navigationRepo.save(navigation);
    return this.navigationMapper.toResponse(updatedNavigation);
  }

  /**
   * Xóa điều hướng theo ID
   */
  async deleteNavigation(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw AppException.badRequest(
        'Mã định danh điều hướng (id) không hợp lệ',
        { id },
        'INVALID_NAVIGATION_ID',
      );
    }

    const trimmedId = id.trim();
    const navigation = await this.navigationRepo.findByIdWithChildrenAndRoles(trimmedId);
    if (!navigation) {
      throw AppException.notFound(
        `Không tìm thấy điều hướng với ID: ${trimmedId}`,
        { id: trimmedId },
        'NAVIGATION_NOT_FOUND',
      );
    }

    if (navigation.children && navigation.children.length > 0) {
      throw AppException.badRequest(
        `Không thể xóa điều hướng vì đang có ${navigation.children.length} điều hướng con trực thuộc`,
        { id: trimmedId, childCount: navigation.children.length },
        'NAVIGATION_HAS_CHILDREN',
      );
    }

    if (navigation.roleNavigations && navigation.roleNavigations.length > 0) {
      throw AppException.badRequest(
        `Không thể xóa điều hướng vì đang được phân quyền cho ${navigation.roleNavigations.length} vai trò`,
        { id: trimmedId, roleCount: navigation.roleNavigations.length },
        'NAVIGATION_ASSIGNED_TO_ROLES',
      );
    }

    const isDeleted = await this.navigationRepo.delete(trimmedId);
    if (!isDeleted) {
      throw AppException.badRequest(
        `Xóa điều hướng thất bại với ID: ${trimmedId}`,
        { id: trimmedId },
        'DELETE_NAVIGATION_FAILED',
      );
    }
  }
}
