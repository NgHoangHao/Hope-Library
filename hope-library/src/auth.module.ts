import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './model/user/user.entity.js';
import { Role } from './model/role/role.entity.js';
import { UserRole } from './model/user-role/user-role.entity.js';
import { Permission } from './model/permission/permission.entity.js';
import { RolePermission } from './model/role-permission/role-permission.entity.js';
import { Navigation } from './model/navigation/navigation.entity.js';
import { RoleNavigation } from './model/role-navigation/role-navigation.entity.js';
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
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRole,
      Permission,
      RolePermission,
      Navigation,
      RoleNavigation,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'hope-library-access-secret-key-2026'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_ACCESS_EXPIRATION', '15m')) as any,
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
