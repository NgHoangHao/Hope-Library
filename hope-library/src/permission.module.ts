import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { Permission, PermissionSchema } from './model/permission/permission.entity.js';
import {
  RolePermission,
  RolePermissionSchema,
} from './model/role-permission/role-permission.entity.js';
import { Role, RoleSchema } from './model/role/role.entity.js';
import { UserRole, UserRoleSchema } from './model/user-role/user-role.entity.js';
import { PermissionRepository } from './repository/permission.repository.js';
import { PermissionService } from './service/permission.service.js';
import { PermissionController } from './controller/permission.controller.js';
import { PermissionMapper } from './mapper/index.js';
import { PermissionsGuard } from './guard/permissions.guard.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: Role.name, schema: RoleSchema },
      { name: UserRole.name, schema: UserRoleSchema },
    ]),
  ],
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
