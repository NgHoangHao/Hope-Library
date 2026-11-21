import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { entities } from './model/index.js';

import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';

import { RoleModule } from './role.module.js';
import { BookModule } from './book.module.js';
import { AuthorModule } from './author.module.js';
import { CategoryModule } from './category.module.js';
import { AuthModule } from './auth.module.js';
import { PermissionModule } from './permission.module.js';
import { NavigationModule } from './navigation.module.js';
import { LoanModule } from './loan.module.js';
import { FineModule } from './fine.module.js';
import { AuditLogModule } from './audit-log.module.js';
import { UserModule } from './user.module.js';
import { DashboardModule } from './dashboard.module.js';
import { SystemConfigModule } from './system-config.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    RoleModule,
    BookModule,
    AuthorModule,
    CategoryModule,
    AuthModule,
    PermissionModule,
    NavigationModule,
    LoanModule,
    FineModule,
    AuditLogModule,
    UserModule,
    DashboardModule,
    SystemConfigModule,

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql' as const,
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT', '1433')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities,
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE') !== 'false',
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
