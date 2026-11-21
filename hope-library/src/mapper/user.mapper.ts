import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { User } from '../model/user/user.entity.js';
import {
  UserResponse,
  CreateUserDto,
  PaginatedUserResponse,
  UserSummaryResponse,
  PaginatedUserSummaryResponse,
} from '../model/user/user.dto.js';
import type { UserWithLoanStats } from '../repository/user.repository.js';
import { RoleResponse } from '../model/role/role.dto.js';
import type { Role } from '../model/role/role.entity.js';

@Injectable()
export class UserProfile extends AutomapperProfile {
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
      createMap(mapper, CreateUserDto, User);
    };
  }

  toResponse(user: User): UserResponse {
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

  toResponseList(users: User[]): UserResponse[] {
    return users.map((u) => this.toResponse(u));
  }

  toPaginatedResponse(
    users: User[],
    total: number,
    page: number,
    size: number,
  ): PaginatedUserResponse {
    const items = this.toResponseList(users);
    const totalPages = size > 0 ? Math.ceil(total / size) : 0;
    return new PaginatedUserResponse({
      items,
      page,
      size,
      total,
      totalPages,
    });
  }

  toSummaryResponse(
    user: User,
    stats?: {
      borrowedBooksCount?: number;
      expiredLoansCount?: number;
      totalFineAmount?: number;
    },
  ): UserSummaryResponse {
    const baseResponse = this.toResponse(user);
    return new UserSummaryResponse({
      ...baseResponse,
      borrowedBooksCount: stats?.borrowedBooksCount ?? 0,
      expiredLoansCount: stats?.expiredLoansCount ?? 0,
      totalFineAmount: stats?.totalFineAmount ?? 0,
    });
  }

  toPaginatedSummaryResponse(
    usersWithStats: UserWithLoanStats[],
    total: number,
    page: number,
    size: number,
  ): PaginatedUserSummaryResponse {
    const items = usersWithStats.map((item) =>
      this.toSummaryResponse(item.user, {
        borrowedBooksCount: item.borrowedBooksCount,
        expiredLoansCount: item.expiredLoansCount,
        totalFineAmount: item.totalFineAmount,
      }),
    );
    const totalPages = size > 0 ? Math.ceil(total / size) : 0;
    return new PaginatedUserSummaryResponse({
      items,
      page,
      size,
      total,
      totalPages,
    });
  }
}

export { UserProfile as UserMapper };
