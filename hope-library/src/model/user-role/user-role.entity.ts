import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../base.entity.js';
import { User } from '../user/user.entity.js';
import { Role } from '../role/role.entity.js';

@Entity('user_roles')
export class UserRole extends BaseEntity {
  @PrimaryColumn({ type: 'uniqueidentifier' })
  userId: string;

  @PrimaryColumn({ type: 'uniqueidentifier' })
  roleId: string;

  @CreateDateColumn({ type: 'datetime2' })
  assignedAt: Date;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  assignedBy?: string | null;

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: Relation<User>;

  @ManyToOne(() => Role, (role) => role.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role?: Relation<Role>;

  constructor(partial?: Partial<UserRole>) {
    super(partial);
    this.assignedAt = new Date();
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
