import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import type { Book } from '../book/book.entity.js';
import type { LoanItem } from '../loan-item/loan-item.entity.js';

export enum BookCopyStatus {
  AVAILABLE = 'AVAILABLE',
  BORROWED = 'BORROWED',
  RESERVED = 'RESERVED',
  LOST = 'LOST',
  DAMAGED = 'DAMAGED',
}

@Schema({ collection: 'book_copies', timestamps: true })
export class BookCopy extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, index: true })
  bookId: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true })
  barcode: string;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  shelfLocation?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, enum: BookCopyStatus, default: BookCopyStatus.AVAILABLE })
  status: BookCopyStatus;

  book?: Book;
  loanItems?: LoanItem[];

  constructor(partial?: Partial<BookCopy>) {
    super(partial);
    this.status = BookCopyStatus.AVAILABLE;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const BookCopySchema = SchemaFactory.createForClass(BookCopy);
