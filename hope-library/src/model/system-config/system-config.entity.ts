import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';

export enum SystemConfigValueType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

@Entity('system_configs')
export class SystemConfig extends BaseEntity {
  @AutoMap(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 150, unique: true })
  key: string;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 'MAX' })
  value: string;

  @AutoMap(() => String)
  @Column({
    type: 'nvarchar',
    length: 30,
    default: SystemConfigValueType.STRING,
  })
  valueType: SystemConfigValueType;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 100, nullable: true })
  group?: string | null;

  @AutoMap(() => String)
  @Column({ type: 'nvarchar', length: 500, nullable: true })
  description?: string | null;

  @AutoMap(() => Boolean)
  @Column({ type: 'bit', default: false })
  isPublic: boolean;

  constructor(partial?: Partial<SystemConfig>) {
    super(partial);
    this.valueType = SystemConfigValueType.STRING;
    this.isPublic = false;
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
