import { randomUUID } from 'node:crypto';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AutoMap } from '@automapper/classes';
import { BaseEntity } from '../base.entity.js';

export enum SystemConfigValueType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

@Schema({ collection: 'system_configs', timestamps: true })
export class SystemConfig extends BaseEntity {
  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true, index: true, default: () => randomUUID() })
  id: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true, unique: true })
  key: string;

  @AutoMap(() => String)
  @Prop({ type: String, required: true })
  value: string;

  @AutoMap(() => String)
  @Prop({
    type: String,
    enum: SystemConfigValueType,
    default: SystemConfigValueType.STRING,
  })
  valueType: SystemConfigValueType;

  @AutoMap(() => String)
  @Prop({ type: String, default: null, index: true })
  group?: string | null;

  @AutoMap(() => String)
  @Prop({ type: String, default: null })
  description?: string | null;

  @AutoMap(() => Boolean)
  @Prop({ type: Boolean, default: false })
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

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
