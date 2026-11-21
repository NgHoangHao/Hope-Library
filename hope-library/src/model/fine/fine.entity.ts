import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import type { User } from '../user/user.entity.js';
import type { Loan } from '../loan/loan.entity.js';

export enum FineStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  WAIVED = 'WAIVED',
}

@Schema({ collection: 'fines', timestamps: true })
export class Fine extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @AutoMap(() => String)
  @Prop({ type: String, default: null, index: true })
  loanId?: string | null;

  @AutoMap(() => Number)
  @Prop({ type: Number, default: 0 })
  amount: number;

  @AutoMap(() => String)
  @Prop({ type: String, required: true })
  reason: string;

  @AutoMap(() => String)
  @Prop({ type: String, enum: FineStatus, default: FineStatus.UNPAID })
  status: FineStatus;

  @AutoMap(() => Date)
  @Prop({ type: Date, default: null })
  paidAt?: Date | null;

  user?: User;
  loan?: Loan | null;

  constructor(partial?: Partial<Fine>) {
    super(partial);
    this.status = FineStatus.UNPAID;
    this.amount = 0;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const FineSchema = SchemaFactory.createForClass(Fine);
