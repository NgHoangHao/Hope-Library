import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
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

@Entity('loans')
@Index('IDX_loans_dueDate_status', ['dueDate', 'status'])
export class Loan extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'uniqueidentifier' })
  userId: string;

  @AutoMap(() => Date)
  @Column({ type: 'datetime2' })
  loanDate: Date;

  @AutoMap(() => Date)
  @Column({ type: 'datetime2' })
  dueDate: Date;

  @AutoMap(() => Date)
  @Column({ type: 'datetime2', nullable: true })
  returnDate?: Date | null;

  @AutoMap(() => Date)
  @Column({ type: 'datetime2', nullable: true })
  pickupDeadline?: Date | null;

  @AutoMap(() => String)
  @Column({
    type: 'nvarchar',
    length: 20,
    default: LoanStatus.PENDING,
  })
  status: LoanStatus;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 1000, nullable: true })
  notes?: string | null;

  @AutoMap(() => User)
  @ManyToOne(() => User, (user) => user.loans, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  user?: Relation<User>;

  @AutoMap(() => [LoanItem])
  @OneToMany(() => LoanItem, (loanItem) => loanItem.loan)
  loanItems?: Relation<LoanItem>[];

  @AutoMap(() => [Fine])
  @OneToMany(() => Fine, (fine) => fine.loan)
  fines?: Relation<Fine>[];

  constructor(partial?: Partial<Loan>) {
    super(partial);
    this.status = LoanStatus.PENDING;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
