import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapWith, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { AuditLog } from '../model/audit-log/audit-log.entity.js';
import {
  AuditLogResponse,
  CreateAuditLogDto,
  PaginatedAuditLogResponse,
} from '../model/audit-log/audit-log.dto.js';
import { User } from '../model/user/user.entity.js';
import { UserResponse } from '../model/user/user.dto.js';

@Injectable()
export class AuditLogProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, User, UserResponse);
      createMap(
        mapper,
        AuditLog,
        AuditLogResponse,
        forMember(
          (dest) => dest.user,
          mapWith(UserResponse, User, (src) => src.user),
        ),
      );
      createMap(mapper, CreateAuditLogDto, AuditLog);
    };
  }

  toResponse(entity: AuditLog): AuditLogResponse {
    return this.mapper.map(entity, AuditLog, AuditLogResponse);
  }

  toResponseList(entities: AuditLog[]): AuditLogResponse[] {
    return this.mapper.mapArray(entities, AuditLog, AuditLogResponse);
  }

  toPaginatedResponse(
    items: AuditLog[],
    total: number,
    page: number,
    size: number,
  ): PaginatedAuditLogResponse {
    const list = this.toResponseList(items);
    const totalPages = size > 0 ? Math.ceil(total / size) : 0;
    return new PaginatedAuditLogResponse({
      items: list,
      page,
      size,
      total,
      totalItems: total,
      totalPages,
    });
  }

  toEntity(dto: CreateAuditLogDto): AuditLog {
    return this.mapper.map(dto, CreateAuditLogDto, AuditLog);
  }
}

export { AuditLogProfile as AuditLogMapper };

