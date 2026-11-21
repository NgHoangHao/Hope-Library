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
import { RoleNavigation } from '../role-navigation/role-navigation.entity.js';

@Entity('navigations')
export class Navigation extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 100, unique: true })
  code: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 255, nullable: true })
  path?: string | null;

  @AutoMap(() => String)
  @Column({ type: 'uniqueidentifier', nullable: true })
  parentId?: string | null;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 100, nullable: true })
  icon?: string | null;

  @AutoMap(() => Number)
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @AutoMap(() => Boolean)
  @Column({ type: 'bit', default: true })
  isVisible: boolean;

  @AutoMap(() => Boolean)
  @Column({ type: 'bit', default: true })
  isActive: boolean;

  @ManyToOne(() => Navigation, (nav) => nav.children, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Relation<Navigation> | null;

  @OneToMany(() => Navigation, (nav) => nav.parent)
  children?: Relation<Navigation>[];

  @OneToMany(() => RoleNavigation, (rn) => rn.navigation)
  roleNavigations?: Relation<RoleNavigation>[];

  constructor(partial?: Partial<Navigation>) {
    super(partial);
    this.sortOrder = 0;
    this.isVisible = true;
    this.isActive = true;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
