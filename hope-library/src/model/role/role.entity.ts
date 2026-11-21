import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import { UserRole } from '../user-role/user-role.entity.js';
import { RolePermission } from '../role-permission/role-permission.entity.js';
import { RoleNavigation } from '../role-navigation/role-navigation.entity.js';

@Entity('roles')
export class Role extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 100, unique: true })
  name: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 255, nullable: true })
  description?: string | null;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles?: Relation<UserRole>[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions?: Relation<RolePermission>[];

  @OneToMany(() => RoleNavigation, (roleNavigation) => roleNavigation.role)
  roleNavigations?: Relation<RoleNavigation>[];

  constructor(partial?: Partial<Role>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
