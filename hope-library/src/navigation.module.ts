import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Navigation, NavigationSchema } from './model/navigation/navigation.entity.js';
import {
  RoleNavigation,
  RoleNavigationSchema,
} from './model/role-navigation/role-navigation.entity.js';
import { Role, RoleSchema } from './model/role/role.entity.js';
import { UserRole, UserRoleSchema } from './model/user-role/user-role.entity.js';
import { NavigationRepository } from './repository/navigation.repository.js';
import { NavigationService } from './service/navigation.service.js';
import { NavigationController } from './controller/navigation.controller.js';
import { NavigationMapper } from './mapper/index.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Navigation.name, schema: NavigationSchema },
      { name: RoleNavigation.name, schema: RoleNavigationSchema },
      { name: Role.name, schema: RoleSchema },
      { name: UserRole.name, schema: UserRoleSchema },
    ]),
  ],
  controllers: [NavigationController],
  providers: [NavigationRepository, NavigationService, NavigationMapper],
  exports: [NavigationService, NavigationRepository, NavigationMapper],
})
export class NavigationModule {}
