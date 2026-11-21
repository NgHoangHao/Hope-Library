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
import { Book } from '../book/book.entity.js';
import { LoanItem } from '../loan-item/loan-item.entity.js';

export enum BookCopyStatus {
  AVAILABLE = 'AVAILABLE',
  BORROWED = 'BORROWED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE',
  LOST = 'LOST',
  DAMAGED = 'DAMAGED',
}

@Entity('book_copies')
export class BookCopy extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'uniqueidentifier' })
  bookId: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 100, unique: true })
  barcode: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 100, nullable: true })
  shelfLocation?: string | null;

  @AutoMap(() => String)
  @Column({
    type: 'nvarchar',
    length: 20,
    default: BookCopyStatus.AVAILABLE,
  })
  status: BookCopyStatus;

  @ManyToOne(() => Book, (book) => book.copies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book?: Relation<Book>;

  @OneToMany(() => LoanItem, (loanItem) => loanItem.bookCopy)
  loanItems?: Relation<LoanItem>[];

  constructor(partial?: Partial<BookCopy>) {
    super(partial);
    this.status = BookCopyStatus.AVAILABLE;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
