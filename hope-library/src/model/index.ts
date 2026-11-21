import type { ModelDefinition } from '@nestjs/mongoose';

export * from './base.entity.js';

// RBAC entities
export * from './user/user.entity.js';
export * from './user/user.dto.js';
export * from './role/role.entity.js';
export * from './permission/permission.entity.js';
export * from './permission/permission.dto.js';
export * from './user-role/user-role.entity.js';
export * from './role-permission/role-permission.entity.js';
export * from './role-permission/role-permission.dto.js';
export * from './navigation/navigation.entity.js';
export * from './navigation/navigation.dto.js';
export * from './role-navigation/role-navigation.entity.js';
export * from './role-navigation/role-navigation.dto.js';

// Library Core entities
export * from './book/book.entity.js';
export * from './book-copy/book-copy.entity.js';
export * from './author/author.entity.js';
export * from './category/category.entity.js';
export * from './loan/loan.entity.js';
export * from './loan/loan.dto.js';
export * from './loan-item/loan-item.entity.js';
export * from './loan-item/loan-item.dto.js';
export * from './fine/fine.entity.js';
export * from './fine/fine.dto.js';
export * from './audit-log/audit-log.entity.js';
export * from './audit-log/audit-log.dto.js';
export * from './system-config/system-config.entity.js';
export * from './system-config/system-config.dto.js';

import { User, UserSchema } from './user/user.entity.js';
import { Role, RoleSchema } from './role/role.entity.js';
import { Permission, PermissionSchema } from './permission/permission.entity.js';
import { UserRole, UserRoleSchema } from './user-role/user-role.entity.js';
import { RolePermission, RolePermissionSchema } from './role-permission/role-permission.entity.js';
import { Navigation, NavigationSchema } from './navigation/navigation.entity.js';
import { RoleNavigation, RoleNavigationSchema } from './role-navigation/role-navigation.entity.js';
import { Book, BookSchema } from './book/book.entity.js';
import { BookCopy, BookCopySchema } from './book-copy/book-copy.entity.js';
import { Author, AuthorSchema } from './author/author.entity.js';
import { Category, CategorySchema } from './category/category.entity.js';
import { Loan, LoanSchema } from './loan/loan.entity.js';
import { LoanItem, LoanItemSchema } from './loan-item/loan-item.entity.js';
import { Fine, FineSchema } from './fine/fine.entity.js';
import { AuditLog, AuditLogSchema } from './audit-log/audit-log.entity.js';
import { SystemConfig, SystemConfigSchema } from './system-config/system-config.entity.js';

export const entities = [
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  Navigation,
  RoleNavigation,
  Book,
  BookCopy,
  Author,
  Category,
  Loan,
  LoanItem,
  Fine,
  AuditLog,
  SystemConfig,
];

export const mongooseModels: ModelDefinition[] = [
  { name: User.name, schema: UserSchema },
  { name: Role.name, schema: RoleSchema },
  { name: Permission.name, schema: PermissionSchema },
  { name: UserRole.name, schema: UserRoleSchema },
  { name: RolePermission.name, schema: RolePermissionSchema },
  { name: Navigation.name, schema: NavigationSchema },
  { name: RoleNavigation.name, schema: RoleNavigationSchema },
  { name: Book.name, schema: BookSchema },
  { name: BookCopy.name, schema: BookCopySchema },
  { name: Author.name, schema: AuthorSchema },
  { name: Category.name, schema: CategorySchema },
  { name: Loan.name, schema: LoanSchema },
  { name: LoanItem.name, schema: LoanItemSchema },
  { name: Fine.name, schema: FineSchema },
  { name: AuditLog.name, schema: AuditLogSchema },
  { name: SystemConfig.name, schema: SystemConfigSchema },
];
