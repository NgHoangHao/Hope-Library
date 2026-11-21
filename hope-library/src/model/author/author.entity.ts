import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import type { Book } from '../book/book.entity.js';

@Schema({ collection: 'authors', timestamps: true })
export class Author extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true })
  name: string;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  biography?: string | null;

  @AutoMap(() => [Object])
  books?: Book[];

  constructor(partial?: Partial<Author>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
