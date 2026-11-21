import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Fine } from '../model/fine/fine.entity.js';
import {
  prepareDocumentForSave,
  toEntity,
} from '../database/mongo.helper.js';

@Injectable()
export class FineRepository {
  constructor(
    @InjectModel(Fine.name)
    private readonly fineModel: Model<Fine>,
  ) {}

  async findById(id: string): Promise<Fine | null> {
    const doc = await this.fineModel.findOne({ id }).lean().exec();
    return toEntity(Fine, doc);
  }

  async save(fine: Fine): Promise<Fine> {
    const payload = prepareDocumentForSave(fine);
    const saved = await this.fineModel
      .findOneAndUpdate(
        { id: payload.id },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return toEntity(Fine, saved) ?? fine;
  }
}
