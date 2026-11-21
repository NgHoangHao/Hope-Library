import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SystemConfig,
  SystemConfigSchema,
} from './model/system-config/system-config.entity.js';
import { SystemConfigRepository } from './repository/system-config.repository.js';
import { SystemConfigService } from './service/system-config.service.js';
import { SystemConfigController } from './controller/system-config.controller.js';
import { SystemConfigMapper } from './mapper/system-config.mapper.js';
import { RedisService } from './utils/redis.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
    ]),
  ],
  controllers: [SystemConfigController],
  providers: [
    SystemConfigRepository,
    SystemConfigService,
    SystemConfigMapper,
    RedisService,
  ],
  exports: [SystemConfigService, SystemConfigRepository, SystemConfigMapper],
})
export class SystemConfigModule {}
