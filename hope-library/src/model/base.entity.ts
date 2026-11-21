import { Prop } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';

export abstract class BaseEntity {
  @Prop({ type: String, default: null })
  createdBy?: string | null;

  @AutoMap(() => Date)
  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: String, default: null })
  updatedBy?: string | null;

  @AutoMap(() => Date)
  @Prop({ type: Date, default: null })
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
