import { AutoMap } from '@automapper/classes';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../base.entity.js';
import { Role } from '../role/role.entity.js';
import { Permission } from '../permission/permission.entity.js';

@Entity('role_permissions')
export class RolePermission extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryColumn({ type: 'uniqueidentifier' })
  roleId: string;

  @AutoMap(() => String)
  @PrimaryColumn({ type: 'uniqueidentifier' })
  permissionId: string;

  @AutoMap(() => Date)
  @CreateDateColumn({ type: 'datetime2' })
  assignedAt: Date;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role?: Relation<Role>;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permissionId' })
  permission?: Relation<Permission>;

  constructor(partial?: Partial<RolePermission>) {
    super(partial);
    this.assignedAt = new Date();
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
