import { AutoMap } from '@automapper/classes';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../base.entity.js';
import { Role } from '../role/role.entity.js';
import { Navigation } from '../navigation/navigation.entity.js';

@Entity('role_navigations')
export class RoleNavigation extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryColumn({ type: 'uniqueidentifier' })
  roleId: string;

  @AutoMap(() => String)
  @PrimaryColumn({ type: 'uniqueidentifier' })
  navigationId: string;

  @AutoMap(() => Date)
  @CreateDateColumn({ type: 'datetime2' })
  assignedAt: Date;

  @ManyToOne(() => Role, (role) => role.roleNavigations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role?: Relation<Role>;

  @ManyToOne(() => Navigation, (nav) => nav.roleNavigations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'navigationId' })
  navigation?: Relation<Navigation>;

  constructor(partial?: Partial<RoleNavigation>) {
    super(partial);
    this.assignedAt = new Date();
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
