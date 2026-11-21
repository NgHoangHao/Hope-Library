import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import { User } from '../user/user.entity.js';
import { LoanItem } from '../loan-item/loan-item.entity.js';
import { Fine } from '../fine/fine.entity.js';

export enum LoanStatus {
  PENDING = 'PENDING',
  BORROWED = 'BORROWED',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@Schema({ collection: 'loans', timestamps: true })
export class Loan extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, index: true })
  userId: string;

  @AutoMap(() => Date)
  @Prop({ type: Date, required: true })
  loanDate: Date;

  @AutoMap(() => Date)
  @Prop({ type: Date, required: true })
  dueDate: Date;

  @AutoMap(() => Date)
  @Prop({ type: Date, default: null })
  returnDate?: Date | null;

  @AutoMap(() => Date)
  @Prop({ type: Date, default: null })
  pickupDeadline?: Date | null;

  @AutoMap(() => String)
  @Prop({ type: String, enum: LoanStatus, default: LoanStatus.PENDING })
  status: LoanStatus;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  notes?: string | null;

  @AutoMap(() => User)
  user?: User;

  @AutoMap(() => [LoanItem])
  loanItems?: LoanItem[];

  @AutoMap(() => [Fine])
  fines?: Fine[];

  constructor(partial?: Partial<Loan>) {
    super(partial);
    this.status = LoanStatus.PENDING;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const LoanSchema = SchemaFactory.createForClass(Loan);
LoanSchema.index({ dueDate: 1, status: 1 });
