import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import { RolePermission } from '../role-permission/role-permission.entity.js';

@Entity('permissions')
export class Permission extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 100, unique: true })
  code: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 255, nullable: true })
  description?: string | null;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions?: Relation<RolePermission>[];

  constructor(partial?: Partial<Permission>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
