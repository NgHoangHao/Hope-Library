import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Fine } from '../model/fine/fine.entity.js';
import { FineResponse } from '../model/fine/fine.dto.js';

@Injectable()
export class FineProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        Fine,
        FineResponse,
        forMember(
          (dest) => dest.amount,
          mapFrom((src) => Number(src.amount ?? 0)),
        ),
      );
    };
  }

  toResponse(fine: Fine): FineResponse {
    return this.mapper.map(fine, Fine, FineResponse);
  }

  toResponseList(fines: Fine[]): FineResponse[] {
    return this.mapper.mapArray(fines, Fine, FineResponse);
  }
}

export { FineProfile as FineMapper };
