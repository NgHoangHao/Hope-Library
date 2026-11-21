import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import { Loan } from '../loan/loan.entity.js';
import { BookCopy } from '../book-copy/book-copy.entity.js';

export enum LoanItemStatus {
  BORROWED = 'BORROWED',
  RETURNED = 'RETURNED',
  LOST = 'LOST',
  DAMAGED = 'DAMAGED',
}

@Entity('loan_items')
export class LoanItem extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'uniqueidentifier' })
  loanId: string;

  @AutoMap(() => String)
  @Column({ type: 'uniqueidentifier' })
  bookCopyId: string;

  @AutoMap(() => Date)
  @Column({ type: 'datetime2', nullable: true })
  returnedDate?: Date | null;

  @AutoMap(() => String)
  @Column({
    type: 'nvarchar',
    length: 20,
    default: LoanItemStatus.BORROWED,
  })
  status: LoanItemStatus;

  @ManyToOne(() => Loan, (loan) => loan.loanItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loanId' })
  loan?: Relation<Loan>;

  @AutoMap(() => BookCopy)
  @ManyToOne(() => BookCopy, (bookCopy) => bookCopy.loanItems, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'bookCopyId' })
  bookCopy?: Relation<BookCopy>;

  constructor(partial?: Partial<LoanItem>) {
    super(partial);
    this.status = LoanItemStatus.BORROWED;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
