import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { RolePermission } from '../model/role-permission/role-permission.entity.js';
import {
  AssignPermissionDto,
  RolePermissionResponse,
} from '../model/role-permission/role-permission.dto.js';

@Injectable()
export class RolePermissionProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        RolePermission,
        RolePermissionResponse,
        forMember(
          (destination) => destination.roleName,
          mapFrom((source) => source.role?.name),
        ),
        forMember(
          (destination) => destination.permissionCode,
          mapFrom((source) => source.permission?.code),
        ),
      );
      createMap(mapper, AssignPermissionDto, RolePermission);
    };
  }

  /**
   * Chuyển đổi một thực thể RolePermission sang RolePermissionResponse bằng AutoMapper
   */
  toResponse(rolePermission: RolePermission): RolePermissionResponse {
    return this.mapper.map(rolePermission, RolePermission, RolePermissionResponse);
  }

  /**
   * Chuyển đổi danh sách thực thể RolePermission sang danh sách RolePermissionResponse bằng AutoMapper
   */
  toResponseList(rolePermissions: RolePermission[]): RolePermissionResponse[] {
    return this.mapper.mapArray(rolePermissions, RolePermission, RolePermissionResponse);
  }

  /**
   * Chuyển đổi AssignPermissionDto sang thực thể RolePermission bằng AutoMapper
   */
  toEntity(dto: AssignPermissionDto): RolePermission {
    return this.mapper.map(dto, AssignPermissionDto, RolePermission);
  }
}

export { RolePermissionProfile as RolePermissionMapper };
