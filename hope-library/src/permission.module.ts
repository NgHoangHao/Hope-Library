import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { Permission } from './model/permission/permission.entity.js';
import { RolePermission } from './model/role-permission/role-permission.entity.js';
import { Role } from './model/role/role.entity.js';
import { PermissionRepository } from './repository/permission.repository.js';
import { PermissionService } from './service/permission.service.js';
import { PermissionController } from './controller/permission.controller.js';
import { PermissionMapper } from './mapper/index.js';
import { PermissionsGuard } from './guard/permissions.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, RolePermission, Role])],
  controllers: [PermissionController],
  providers: [
    PermissionRepository,
    PermissionService,
    PermissionMapper,
    PermissionsGuard,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [PermissionService, PermissionRepository, PermissionMapper, PermissionsGuard],
})
export class PermissionModule {}
