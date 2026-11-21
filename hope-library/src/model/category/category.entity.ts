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

@Entity('categories')
export class Category extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 255, unique: true })
  name: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 500, nullable: true })
  description?: string | null;

  @AutoMap(() => [Book])
  @OneToMany(() => Book, (book) => book.category)
  books?: Relation<Book>[];

  constructor(partial?: Partial<Category>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
