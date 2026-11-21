import { Injectable } from '@nestjs/common';
import { RoleRepository } from '../repository/role.repository.js';
import { CreateRoleDto, RoleResponse, UpdateRoleDto } from '../model/role/role.dto.js';
import { AppException } from '../common/index.js';
import { RoleMapper } from '../mapper/role.mapper.js';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly roleMapper: RoleMapper,
  ) {}

  get roleRepository(): RoleRepository {
    return this.roleRepo;
  }

  /**
   * Lấy danh sách tất cả vai trò (không phân trang), map sang RoleResponse bằng AutoMapper
   */
  async getAllRoles(): Promise<RoleResponse[]> {
    const roles = await this.roleRepo.findAll();
    return this.roleMapper.toResponseList(roles);
  }

  /**
   * Lấy chi tiết vai trò theo ID, map sang RoleResponse bằng AutoMapper
   */
  async getRoleById(id: string): Promise<RoleResponse> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw AppException.notFound(
        `Không tìm thấy vai trò với ID: ${id}`,
        { id },
        'ROLE_NOT_FOUND',
      );
    }
    return this.roleMapper.toResponse(role);
  }

  /**
   * Thêm vai trò mới (truyền vào name, description)
   */
  async createRole(dto: CreateRoleDto): Promise<RoleResponse> {
    if (!dto.name || !dto.name.trim()) {
      throw AppException.badRequest(
        'Tên vai trò không được để trống',
        { field: 'name' },
        'ROLE_NAME_REQUIRED',
      );
    }
    const trimmedName = dto.name.trim();
    const existing = await this.roleRepo.findByName(trimmedName);
    if (existing) {
      throw AppException.conflict(
        `Tên vai trò '${trimmedName}' đã tồn tại`,
        { name: trimmedName },
        'ROLE_NAME_CONFLICT',
      );
    }
    const role = this.roleMapper.toEntity(dto);
    role.name = trimmedName;
    if (dto.description !== undefined) {
      role.description = dto.description?.trim() || null;
    }
    const savedRole = await this.roleRepo.save(role);
    return this.roleMapper.toResponse(savedRole);
  }

  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleResponse> {
     const role = await this.roleRepository.findById(id);
    if (!role) {
      throw AppException.notFound(
        `Không tìm thấy vai trò với ID: ${id}`,
        { id },
        'ROLE_NOT_FOUND',
      );
    }
    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw AppException.badRequest(
          'Tên vai trò không hợp lệ',
          { field: 'name' },
          'INVALID_ROLE_NAME',
        );
      }

      const trimmedName = dto.name.trim();
      if (trimmedName.toLowerCase() !== role.name.toLowerCase()) {
        const existing = await this.roleRepository.findByName(trimmedName);
        if (existing && existing.id !== id) {
          throw AppException.conflict(
            `Tên vai trò '${trimmedName}' đã tồn tại`,
            { name: trimmedName },
            'ROLE_NAME_CONFLICT',
          );
        }
      }
      role.name = trimmedName;
    }

    if (dto.description !== undefined) {
      role.description = dto.description?.trim() || null;
    }

    role.updatedAt = new Date();
    const updatedRole = await this.roleRepository.save(role);
    return this.roleMapper.toResponse(updatedRole);
  }


  async deleteRole(id: string): Promise<void> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw AppException.notFound(
        `Không tìm thấy vai trò với ID: ${id}`,
        { id },
        'ROLE_NOT_FOUND',
      );
    }
    const isDeleted = await this.roleRepository.delete(id);
    if (!isDeleted) {
      throw AppException.badRequest(
        `Xóa vai trò thất bại với ID: ${id}`,
        { id },
        'DELETE_ROLE_FAILED',
      );
    }
  }
}
