import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from './model/user/user.entity.js';
import { Role, RoleSchema } from './model/role/role.entity.js';
import { UserRole, UserRoleSchema } from './model/user-role/user-role.entity.js';
import { Permission, PermissionSchema } from './model/permission/permission.entity.js';
import {
  RolePermission,
  RolePermissionSchema,
} from './model/role-permission/role-permission.entity.js';
import { Navigation, NavigationSchema } from './model/navigation/navigation.entity.js';
import {
  RoleNavigation,
  RoleNavigationSchema,
} from './model/role-navigation/role-navigation.entity.js';
import { AuthRepository } from './repository/auth.repository.js';
import { AuthService } from './service/auth.service.js';
import { AuthController } from './controller/auth.controller.js';
import { AuthMapper, RoleNavigationMapper, RolePermissionMapper } from './mapper/index.js';
import { MailService } from './utils/mail.service.js';
import { RedisService } from './utils/redis.service.js';
import { FileStorageService } from './utils/file-storage.service.js';
import { SystemConfigModule } from './system-config.module.js';

@Module({
  imports: [
    SystemConfigModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: UserRole.name, schema: UserRoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: Navigation.name, schema: NavigationSchema },
      { name: RoleNavigation.name, schema: RoleNavigationSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'hope-library-access-secret-key-2026'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRATION', '15m') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    AuthMapper,
    RolePermissionMapper,
    RoleNavigationMapper,
    MailService,
    RedisService,
    FileStorageService,
  ],
  exports: [
    AuthService,
    AuthRepository,
    AuthMapper,
    RolePermissionMapper,
    RoleNavigationMapper,
    JwtModule,
    FileStorageService,
  ],
})
export class AuthModule {}
