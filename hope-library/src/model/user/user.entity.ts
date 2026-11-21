import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';
import { UserRole } from '../user-role/user-role.entity.js';
import { Loan } from '../loan/loan.entity.js';
import { Fine } from '../fine/fine.entity.js';
import { AuditLog } from '../audit-log/audit-log.entity.js';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
}

@Entity('users')
export class User extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 50, unique: true, nullable: false })
  code: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 100, unique: true })
  username: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'nvarchar', length: 255 })
  passwordHash: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 255, nullable: true })
  fullName: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 50, nullable: true })
  phone?: string | null;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 500, nullable: true })
  avartarUrl?: string | null;

  get avatarUrl(): string | null | undefined {
    return this.avartarUrl;
  }

  set avatarUrl(value: string | null | undefined) {
    this.avartarUrl = value;
  }

  @AutoMap(() => String)
  @Column({
    type: 'nvarchar',
    length: 20,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles?: Relation<UserRole>[];

  @OneToMany(() => Loan, (loan) => loan.user)
  loans?: Relation<Loan>[];

  @OneToMany(() => Fine, (fine) => fine.user)
  fines?: Relation<Fine>[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs?: Relation<AuditLog>[];

  constructor(partial?: Partial<User>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
