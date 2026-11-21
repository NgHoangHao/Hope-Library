import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import type { RolePermission } from '../role-permission/role-permission.entity.js';

@Schema({ collection: 'permissions', timestamps: true })
export class Permission extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true })
  code: string;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  description?: string | null;

  rolePermissions?: RolePermission[];

  constructor(partial?: Partial<Permission>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
