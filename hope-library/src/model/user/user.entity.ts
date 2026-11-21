import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import type { UserRole } from '../user-role/user-role.entity.js';
import type { Loan } from '../loan/loan.entity.js';
import type { Fine } from '../fine/fine.entity.js';
import type { AuditLog } from '../audit-log/audit-log.entity.js';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
}

@Schema({ collection: 'users', timestamps: true })
export class User extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true })
  code: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true })
  username: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  passwordHash: string;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  fullName: string;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  phone?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  avartarUrl?: string | null;

  get avatarUrl(): string | null | undefined {
    return this.avartarUrl;
  }

  set avatarUrl(value: string | null | undefined) {
    this.avartarUrl = value;
  }

  @AutoMap(() => String)
  @Prop({ type: String, enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  userRoles?: UserRole[];
  loans?: Loan[];
  fines?: Fine[];
  auditLogs?: AuditLog[];

  constructor(partial?: Partial<User>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
