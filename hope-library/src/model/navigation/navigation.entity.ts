import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import type { RoleNavigation } from '../role-navigation/role-navigation.entity.js';

@Schema({ collection: 'navigations', timestamps: true })
export class Navigation extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true })
  code: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true })
  name: string;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  path?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null, index: true })
  parentId?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  icon?: string | null;

  @AutoMap(() => Number)
  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  @AutoMap(() => Boolean)
  @Prop({ type: Boolean, default: true })
  isVisible: boolean;

  @AutoMap(() => Boolean)
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  parent?: Navigation | null;
  children?: Navigation[];
  roleNavigations?: RoleNavigation[];

  constructor(partial?: Partial<Navigation>) {
    super(partial);
    this.sortOrder = 0;
    this.isVisible = true;
    this.isActive = true;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const NavigationSchema = SchemaFactory.createForClass(Navigation);
