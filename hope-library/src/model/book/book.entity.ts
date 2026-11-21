import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import { Author } from '../author/author.entity.js';
import { Category } from '../category/category.entity.js';
import { BookCopy } from '../book-copy/book-copy.entity.js';

export enum BookStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity('books')
export class Book extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 255 })
  title: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 50, nullable: true })
  isbn?: string | null;

  @AutoMap(() => String)
  @Column({ type: 'uniqueidentifier', nullable: true })
  authorId?: string | null;

  @AutoMap(() => String)
  @Column({ type: 'uniqueidentifier', nullable: true })
  categoryId?: string | null;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 255, nullable: true })
  publisher?: string | null;

  @AutoMap(() => Number)
  @Column({ type: 'int', nullable: true })
  publicationYear?: number | null;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 50, nullable: true })
  edition?: string | null;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  description?: string | null;

  @AutoMap(() => Number)
  @Column({ type: 'int', default: 0 })
  totalCopies: number;

  @AutoMap(() => Number)
  @Column({ type: 'int', default: 0 })
  availableCopies: number;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 255, nullable: true })
  bookUrl?: string | null;

  @AutoMap(() => String)
  @Column({
    type: 'nvarchar',
    length: 20,
    default: BookStatus.ACTIVE,
  })
  status: BookStatus;

  @ManyToOne(() => Author, (author) => author.books, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'authorId' })
  author?: Relation<Author> | null;

  @ManyToOne(() => Category, (category) => category.books, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Relation<Category> | null;

  @AutoMap(() => [BookCopy])
  @OneToMany(() => BookCopy, (bookCopy) => bookCopy.book)
  copies?: Relation<BookCopy>[];

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
