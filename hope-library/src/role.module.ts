import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './model/role/role.entity.js';
import { RoleRepository } from './repository/role.repository.js';
import { RoleService } from './service/role.service.js';
import { RoleController } from './controller/role.controller.js';
import { RoleMapper } from './mapper/index.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
  ],
  controllers: [RoleController],
  providers: [RoleRepository, RoleService, RoleMapper],
  exports: [RoleService, RoleRepository, RoleMapper],
})
export class RoleModule {}
