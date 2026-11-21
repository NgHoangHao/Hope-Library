import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Role } from '../model/role/role.entity.js';
import { CreateRoleDto, RoleResponse } from '../model/role/role.dto.js';

@Injectable()
export class RoleProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, Role, RoleResponse);
      createMap(mapper, CreateRoleDto, Role);
    };
  }

  /**
   * Chuyển đổi một thực thể Role sang RoleResponse bằng AutoMapper
   */
  toResponse(role: Role): RoleResponse {
    return this.mapper.map(role, Role, RoleResponse);
  }

  /**
   * Chuyển đổi danh sách thực thể Role sang danh sách RoleResponse bằng AutoMapper
   */
  toResponseList(roles: Role[]): RoleResponse[] {
    return this.mapper.mapArray(roles, Role, RoleResponse);
  }

  /**
   * Chuyển đổi CreateRoleDto sang thực thể Role bằng AutoMapper
   */
  toEntity(dto: CreateRoleDto): Role {
    return this.mapper.map(dto, CreateRoleDto, Role);
  }
}

export { RoleProfile as RoleMapper };