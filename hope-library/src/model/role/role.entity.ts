import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import type { UserRole } from '../user-role/user-role.entity.js';
import type { RolePermission } from '../role-permission/role-permission.entity.js';
import type { RoleNavigation } from '../role-navigation/role-navigation.entity.js';

@Schema({ collection: 'roles', timestamps: true })
export class Role extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  description?: string | null;

  userRoles?: UserRole[];
  rolePermissions?: RolePermission[];
  roleNavigations?: RoleNavigation[];

  constructor(partial?: Partial<Role>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const RoleSchema = SchemaFactory.createForClass(Role);
