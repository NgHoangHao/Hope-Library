import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import { Book } from '../book/book.entity.js';

@Entity('authors')
export class Author extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  biography?: string | null;

  @AutoMap(() => [Book])
  @OneToMany(() => Book, (book) => book.author)
  books?: Relation<Book>[];

  constructor(partial?: Partial<Author>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
