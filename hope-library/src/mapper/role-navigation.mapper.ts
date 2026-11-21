import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { RoleNavigation } from '../model/role-navigation/role-navigation.entity.js';
import {
  AssignNavigationDto,
  RoleNavigationResponse,
} from '../model/role-navigation/role-navigation.dto.js';

@Injectable()
export class RoleNavigationProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        RoleNavigation,
        RoleNavigationResponse,
        forMember(
          (destination) => destination.roleName,
          mapFrom((source) => source.role?.name),
        ),
        forMember(
          (destination) => destination.navigationCode,
          mapFrom((source) => source.navigation?.code),
        ),
        forMember(
          (destination) => destination.navigationName,
          mapFrom((source) => source.navigation?.name),
        ),
      );
      createMap(mapper, AssignNavigationDto, RoleNavigation);
    };
  }

  /**
   * Chuyển đổi một thực thể RoleNavigation sang RoleNavigationResponse bằng AutoMapper
   */
  toResponse(roleNavigation: RoleNavigation): RoleNavigationResponse {
    return this.mapper.map(roleNavigation, RoleNavigation, RoleNavigationResponse);
  }

  /**
   * Chuyển đổi danh sách thực thể RoleNavigation sang danh sách RoleNavigationResponse bằng AutoMapper
   */
  toResponseList(roleNavigations: RoleNavigation[]): RoleNavigationResponse[] {
    return this.mapper.mapArray(roleNavigations, RoleNavigation, RoleNavigationResponse);
  }

  /**
   * Chuyển đổi AssignNavigationDto sang thực thể RoleNavigation bằng AutoMapper
   */
  toEntity(dto: AssignNavigationDto): RoleNavigation {
    return this.mapper.map(dto, AssignNavigationDto, RoleNavigation);
  }
}

export { RoleNavigationProfile as RoleNavigationMapper };
