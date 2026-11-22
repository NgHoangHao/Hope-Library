import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import type { Author } from '../author/author.entity.js';
import type { Category } from '../category/category.entity.js';
import { BookCopy } from '../book-copy/book-copy.entity.js';

export enum BookStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Schema({ collection: 'books', timestamps: true })
export class Book extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true })
  title: string;

  @AutoMap(() => String)
  @Prop({ type: String, default: null, index: true })
  isbn?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null, index: true })
  authorId?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null, index: true })
  categoryId?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  publisher?: string | null;

  @AutoMap(() => Number)
  @Prop({ type: Number, default: null })
  publicationYear?: number | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  edition?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  description?: string | null;

  @AutoMap(() => Number)
  @Prop({ type: Number, default: 0 })
  totalCopies: number;

  @AutoMap(() => Number)
  @Prop({ type: Number, default: 0 })
  availableCopies: number;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  bookUrl?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  pdfUrl?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, enum: BookStatus, default: BookStatus.ACTIVE })
  status: BookStatus;

  author?: Author | null;
  category?: Category | null;

  @AutoMap(() => [BookCopy])
  copies?: BookCopy[];

  constructor(partial?: Partial<Book>) {
    super(partial);
    this.totalCopies = 0;
    this.availableCopies = 0;
    this.status = BookStatus.ACTIVE;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const BookSchema = SchemaFactory.createForClass(Book);
