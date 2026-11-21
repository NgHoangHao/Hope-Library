import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AutoMap } from '@automapper/classes';

export abstract class BaseEntity {
  @Column({ type: 'nvarchar', length: 100, nullable: true })
  createdBy?: string | null;

  @AutoMap(() => Date)
  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  updatedBy?: string | null;

  @AutoMap(() => Date)
  @UpdateDateColumn({ type: 'datetime2', nullable: true })
  updatedAt?: Date | null;

  // Getter/setter hỗ trợ tên gọi updateBy
  get updateBy(): string | null | undefined {
    return this.updatedBy;
  }
  set updateBy(value: string | null | undefined) {
    this.updatedBy = value;
  }

  // Getter/setter hỗ trợ tên gọi updateAt
  get updateAt(): Date | null | undefined {
    return this.updatedAt;
  }
  set updateAt(value: Date | null | undefined) {
    this.updatedAt = value;
  }

  constructor(partial?: Partial<BaseEntity>) {
    this.createdAt = new Date();
    this.updatedAt = new Date();
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export { BaseEntity as Base };
