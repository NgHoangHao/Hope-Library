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

import { User } from './user/user.entity.js';
import { Role } from './role/role.entity.js';
import { Permission } from './permission/permission.entity.js';
import { UserRole } from './user-role/user-role.entity.js';
import { RolePermission } from './role-permission/role-permission.entity.js';
import { Navigation } from './navigation/navigation.entity.js';
import { RoleNavigation } from './role-navigation/role-navigation.entity.js';
import { Book } from './book/book.entity.js';
import { BookCopy } from './book-copy/book-copy.entity.js';
import { Author } from './author/author.entity.js';
import { Category } from './category/category.entity.js';
import { Loan } from './loan/loan.entity.js';
import { LoanItem } from './loan-item/loan-item.entity.js';
import { Fine } from './fine/fine.entity.js';
import { AuditLog } from './audit-log/audit-log.entity.js';
import { SystemConfig } from './system-config/system-config.entity.js';

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
