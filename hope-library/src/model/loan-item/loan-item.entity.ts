import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import type { Loan } from '../loan/loan.entity.js';
import { BookCopy } from '../book-copy/book-copy.entity.js';

export enum LoanItemStatus {
  BORROWED = 'BORROWED',
  RETURNED = 'RETURNED',
  LOST = 'LOST',
  DAMAGED = 'DAMAGED',
}

@Schema({ collection: 'loan_items', timestamps: true })
export class LoanItem extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, index: true })
  loanId: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, index: true })
  bookCopyId: string;

  @AutoMap(() => Date)
  @Prop({ type: Date, default: null })
  returnedDate?: Date | null;

  @AutoMap(() => String)
  @Prop({ type: String, enum: LoanItemStatus, default: LoanItemStatus.BORROWED })
  status: LoanItemStatus;

  loan?: Loan;

  @AutoMap(() => BookCopy)
  bookCopy?: BookCopy;

  constructor(partial?: Partial<LoanItem>) {
    super(partial);
    this.status = LoanItemStatus.BORROWED;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const LoanItemSchema = SchemaFactory.createForClass(LoanItem);
