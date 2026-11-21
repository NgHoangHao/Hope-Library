import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLog } from './model/audit-log/audit-log.entity.js';
import { User } from './model/user/user.entity.js';
import { AuditLogRepository } from './repository/audit-log.repository.js';
import { AuditLogService } from './service/audit-log.service.js';
import { AuditLogController } from './controller/audit-log.controller.js';
import { AuditLogMapper } from './mapper/audit-log.mapper.js';
import { AuditLogInterceptor } from './interceptor/audit-log.interceptor.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, User])],
  controllers: [AuditLogController],
  providers: [
    AuditLogRepository,
    AuditLogService,
    AuditLogMapper,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  exports: [AuditLogService, AuditLogRepository, AuditLogMapper],
})
export class AuditLogModule {}

