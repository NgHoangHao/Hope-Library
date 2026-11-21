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

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'uniqueidentifier', nullable: true })
  userId?: string | null;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 100 })
  action: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 100 })
  targetResource: string;

  @Column('simple-json', { nullable: true })
  details?: Record<string, unknown> | null;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 50, nullable: true })
  ipAddress?: string | null;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 500, nullable: true })
  userAgent?: string | null;

  @AutoMap(() => User)
  @ManyToOne(() => User, (user) => user.auditLogs, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user?: Relation<User> | null;

  constructor(partial?: Partial<AuditLog>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
