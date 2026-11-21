import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import { User } from '../user/user.entity.js';

@Schema({ collection: 'audit_logs', timestamps: true })
export class AuditLog extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, default: null, index: true })
  userId?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, required: true })
  action: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true })
  targetResource: string;

  @Prop({ type: Object, default: null })
  details?: Record<string, unknown> | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  ipAddress?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  userAgent?: string | null;

  @AutoMap(() => User)
  user?: User | null;

  constructor(partial?: Partial<AuditLog>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
