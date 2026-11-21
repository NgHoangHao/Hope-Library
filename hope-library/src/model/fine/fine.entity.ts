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
import { User } from '../user/user.entity.js';
import { Loan } from '../loan/loan.entity.js';

export enum FineStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  WAIVED = 'WAIVED',
}

@Entity('fines')
export class Fine extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'uniqueidentifier' })
  userId: string;

  @AutoMap(() => String)
  @Column({ type: 'uniqueidentifier', nullable: true })
  loanId?: string | null;

  @AutoMap(() => Number)
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  amount: number;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 500 })
  reason: string;

  @AutoMap(() => String)
  @Column({
    type: 'nvarchar',
    length: 20,
    default: FineStatus.UNPAID,
  })
  status: FineStatus;

  @AutoMap(() => Date)
  @Column({ type: 'datetime2', nullable: true })
  paidAt?: Date | null;

  @ManyToOne(() => User, (user) => user.fines, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  user?: Relation<User>;

  @ManyToOne(() => Loan, (loan) => loan.fines, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'loanId' })
  loan?: Relation<Loan> | null;

  constructor(partial?: Partial<Fine>) {
    super(partial);
    this.status = FineStatus.UNPAID;
    this.amount = 0;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
