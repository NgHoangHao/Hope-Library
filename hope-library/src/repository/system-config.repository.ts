import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { SystemConfig } from '../model/system-config/system-config.entity.js';
import {
  prepareDocumentForSave,
  toEntities,
  toEntity,
} from '../database/mongo.helper.js';

@Injectable()
export class SystemConfigRepository {
  constructor(
    @InjectModel(SystemConfig.name)
    private readonly systemConfigModel: Model<SystemConfig>,
  ) {}

  async findAll(group?: string): Promise<SystemConfig[]> {
    if (group && group.trim()) {
      const docs = await this.systemConfigModel
        .find({ group: group.trim() })
        .sort({ key: 1 })
        .lean()
        .exec();
      return toEntities(SystemConfig, docs);
    }

    const docs = await this.systemConfigModel
      .find()
      .sort({ group: 1, key: 1 })
      .lean()
      .exec();
    return toEntities(SystemConfig, docs);
  }

  async findById(id: string): Promise<SystemConfig | null> {
    const doc = await this.systemConfigModel.findOne({ id }).lean().exec();
    return toEntity(SystemConfig, doc);
  }

  async findByKey(key: string): Promise<SystemConfig | null> {
    const doc = await this.systemConfigModel.findOne({ key }).lean().exec();
    return toEntity(SystemConfig, doc);
  }

  async save(config: SystemConfig): Promise<SystemConfig> {
    const payload = prepareDocumentForSave(config);
    const saved = await this.systemConfigModel
      .findOneAndUpdate(
        { id: payload.id },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return toEntity(SystemConfig, saved) ?? config;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.systemConfigModel.deleteOne({ id }).exec();
    return (result.deletedCount ?? 0) > 0;
  }

  async deleteByKey(key: string): Promise<boolean> {
    const result = await this.systemConfigModel.deleteOne({ key }).exec();
    return (result.deletedCount ?? 0) > 0;
  }
}
