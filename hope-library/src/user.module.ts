import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './model/user/user.entity.js';
import { Role, RoleSchema } from './model/role/role.entity.js';
import { UserRole, UserRoleSchema } from './model/user-role/user-role.entity.js';
import { Loan, LoanSchema } from './model/loan/loan.entity.js';
import { Fine, FineSchema } from './model/fine/fine.entity.js';
import { AuditLog, AuditLogSchema } from './model/audit-log/audit-log.entity.js';
import { UserRepository } from './repository/user.repository.js';
import { UserService } from './service/user.service.js';
import { UserController } from './controller/user.controller.js';
import { UserMapper } from './mapper/index.js';
import { FileStorageService } from './utils/file-storage.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: UserRole.name, schema: UserRoleSchema },
      { name: Loan.name, schema: LoanSchema },
      { name: Fine.name, schema: FineSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserRepository, UserService, UserMapper, FileStorageService],
  exports: [UserService, UserRepository, UserMapper],
})
export class UserModule {}
