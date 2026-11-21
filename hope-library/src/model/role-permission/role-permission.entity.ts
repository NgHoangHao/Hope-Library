import { AutoMap } from '@automapper/classes';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseEntity } from '../base.entity.js';
import type { Role } from '../role/role.entity.js';
import type { Permission } from '../permission/permission.entity.js';

@Schema({ collection: 'role_permissions', timestamps: true })
export class RolePermission extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, index: true })
  roleId: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, index: true })
  permissionId: string;

  @AutoMap(() => Date)
  @Prop({ type: Date, default: () => new Date() })
  assignedAt: Date;

  role?: Role;
  permission?: Permission;

  constructor(partial?: Partial<RolePermission>) {
    super(partial);
    this.assignedAt = new Date();
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);
RolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true });
