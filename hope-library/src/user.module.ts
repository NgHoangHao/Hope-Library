import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './model/user/user.entity.js';
import { Role } from './model/role/role.entity.js';
import { UserRole } from './model/user-role/user-role.entity.js';
import { UserRepository } from './repository/user.repository.js';
import { UserService } from './service/user.service.js';
import { UserController } from './controller/user.controller.js';
import { UserMapper } from './mapper/index.js';
import { FileStorageService } from './utils/file-storage.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, UserRole])],
  controllers: [UserController],
  providers: [UserRepository, UserService, UserMapper, FileStorageService],
  exports: [UserService, UserRepository, UserMapper],
})
export class UserModule {}
