import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Navigation } from './model/navigation/navigation.entity.js';
import { RoleNavigation } from './model/role-navigation/role-navigation.entity.js';
import { Role } from './model/role/role.entity.js';
import { UserRole } from './model/user-role/user-role.entity.js';
import { NavigationRepository } from './repository/navigation.repository.js';
import { NavigationService } from './service/navigation.service.js';
import { NavigationController } from './controller/navigation.controller.js';
import { NavigationMapper } from './mapper/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Navigation, RoleNavigation, Role, UserRole])],
  controllers: [NavigationController],
  providers: [NavigationRepository, NavigationService, NavigationMapper],
  exports: [NavigationService, NavigationRepository, NavigationMapper],
})
export class NavigationModule {}
