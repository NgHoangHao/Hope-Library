import { AutoMap } from '@automapper/classes';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseEntity } from '../base.entity.js';
import type { Role } from '../role/role.entity.js';
import type { Navigation } from '../navigation/navigation.entity.js';

@Schema({ collection: 'role_navigations', timestamps: true })
export class RoleNavigation extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, index: true })
  roleId: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, index: true })
  navigationId: string;

  @AutoMap(() => Date)
  @Prop({ type: Date, default: () => new Date() })
  assignedAt: Date;

  role?: Role;
  navigation?: Navigation;

  constructor(partial?: Partial<RoleNavigation>) {
    super(partial);
    this.assignedAt = new Date();
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const RoleNavigationSchema = SchemaFactory.createForClass(RoleNavigation);
RoleNavigationSchema.index({ roleId: 1, navigationId: 1 }, { unique: true });
