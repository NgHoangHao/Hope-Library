import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseEntity } from '../base.entity.js';
import type { User } from '../user/user.entity.js';
import type { Role } from '../role/role.entity.js';

@Schema({ collection: 'user_roles', timestamps: true })
export class UserRole extends BaseEntity {
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: String, required: true, index: true })
  roleId: string;

  @Prop({ type: Date, default: () => new Date() })
  assignedAt: Date;

  @Prop({ type: String, default: null })
  assignedBy?: string | null;

  user?: User;
  role?: Role;

  constructor(partial?: Partial<UserRole>) {
    super(partial);
    this.assignedAt = new Date();
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const UserRoleSchema = SchemaFactory.createForClass(UserRole);
UserRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });
