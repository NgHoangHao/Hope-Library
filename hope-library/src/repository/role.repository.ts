import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Role } from '../model/role/role.entity.js';
import {
  prepareDocumentForSave,
  toEntities,
  toEntity,
} from '../database/mongo.helper.js';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    const docs = await this.roleModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return toEntities(Role, docs);
  }

  async findById(id: string): Promise<Role | null> {
    const doc = await this.roleModel.findOne({ id }).lean().exec();
    return toEntity(Role, doc);
  }

  async findByName(name: string): Promise<Role | null> {
    const doc = await this.roleModel.findOne({ name }).lean().exec();
    return toEntity(Role, doc);
  }

  async create(data: { name: string; description?: string | null }): Promise<Role> {
    const role = new Role(data);
    return this.save(role);
  }

  async save(role: Role): Promise<Role> {
    const payload = prepareDocumentForSave(role);
    const saved = await this.roleModel
      .findOneAndUpdate(
        { id: payload.id },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return toEntity(Role, saved) ?? role;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.roleModel.deleteOne({ id }).exec();
    return (result.deletedCount ?? 0) > 0;
  }
}
