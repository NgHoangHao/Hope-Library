import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { SystemConfig } from '../model/system-config/system-config.entity.js';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  SystemConfigResponse,
} from '../model/system-config/system-config.dto.js';

@Injectable()
export class SystemConfigProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, SystemConfig, SystemConfigResponse);
      createMap(mapper, CreateSystemConfigDto, SystemConfig);
      createMap(mapper, UpdateSystemConfigDto, SystemConfig);
    };
  }

  toResponse(config: SystemConfig): SystemConfigResponse {
    return this.mapper.map(config, SystemConfig, SystemConfigResponse);
  }

  toResponseList(configs: SystemConfig[]): SystemConfigResponse[] {
    return this.mapper.mapArray(configs, SystemConfig, SystemConfigResponse);
  }
}

export { SystemConfigProfile as SystemConfigMapper };
