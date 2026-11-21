import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Permission } from '../model/permission/permission.entity.js';
import {
  CreatePermissionDto,
  PermissionResponse,
  UpdatePermissionDto,
} from '../model/permission/permission.dto.js';

@Injectable()
export class PermissionProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, Permission, PermissionResponse);
      createMap(mapper, CreatePermissionDto, Permission);
      createMap(mapper, UpdatePermissionDto, Permission);
    };
  }

  /**
   * Chuyển đổi một thực thể Permission sang PermissionResponse bằng AutoMapper
   */
  toResponse(permission: Permission): PermissionResponse {
    return this.mapper.map(permission, Permission, PermissionResponse);
  }

  /**
   * Chuyển đổi danh sách thực thể Permission sang danh sách PermissionResponse bằng AutoMapper
   */
  toResponseList(permissions: Permission[]): PermissionResponse[] {
    return this.mapper.mapArray(permissions, Permission, PermissionResponse);
  }

  /**
   * Chuyển đổi CreatePermissionDto sang thực thể Permission bằng AutoMapper
   */
  toEntity(dto: CreatePermissionDto): Permission {
    return this.mapper.map(dto, CreatePermissionDto, Permission);
  }
}

export { PermissionProfile as PermissionMapper };
