import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { User } from '../model/user/user.entity.js';
import { UserResponse, UpdateProfileDto } from '../model/user/user.dto.js';
import { RoleResponse } from '../model/role/role.dto.js';
import type { Role } from '../model/role/role.entity.js';

@Injectable()
export class AuthProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        User,
        UserResponse,
        forMember(
          (destination) => destination.roles,
          mapFrom((source) =>
            source.userRoles
              ?.map((ur) => ur.role?.name)
              .filter((name): name is string => Boolean(name)) ?? [],
          ),
        ),
        forMember(
          (destination) => destination.roleList,
          mapFrom((source) =>
            source.userRoles
              ?.map((ur) => ur.role)
              .filter((r): r is Role => Boolean(r))
              .map(
                (r) =>
                  new RoleResponse({
                    id: r.id,
                    name: r.name,
                    description: r.description,
                  }),
              ) ?? [],
          ),
        ),
        forMember(
          (destination) => destination.roleDetails,
          mapFrom((source) =>
            source.userRoles
              ?.map((ur) => ur.role)
              .filter((r): r is Role => Boolean(r))
              .map(
                (r) =>
                  new RoleResponse({
                    id: r.id,
                    name: r.name,
                    description: r.description,
                  }),
              ) ?? [],
          ),
        ),
        forMember(
          (destination) => destination.avatarUrl,
          mapFrom((source) => source.avartarUrl ?? null),
        ),
      );
      createMap(mapper, UpdateProfileDto, User);
    };
  }

  toUserResponse(user: User): UserResponse {
    const res = this.mapper.map(user, User, UserResponse);
    if (user.userRoles) {
      const mappedRoleList = user.userRoles
        .map((ur) => ur.role)
        .filter((r): r is Role => Boolean(r))
        .map(
          (r) =>
            new RoleResponse({
              id: r.id,
              name: r.name,
              description: r.description,
            }),
        );
      if (!res.roleList || res.roleList.length === 0) {
        res.roleList = mappedRoleList;
      }
      if (!res.roleDetails || res.roleDetails.length === 0) {
        res.roleDetails = mappedRoleList;
      }
      if (!res.roles || res.roles.length === 0) {
        res.roles = mappedRoleList.map((r) => r.name);
      }
    }
    return res;
  }

  toUserResponseList(users: User[]): UserResponse[] {
    return this.mapper.mapArray(users, User, UserResponse);
  }
}

export { AuthProfile as AuthMapper };
