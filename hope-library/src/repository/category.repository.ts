import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Category } from '../model/category/category.entity.js';
import { Book } from '../model/book/book.entity.js';
import {
  prepareDocumentForSave,
  toEntities,
  toEntity,
} from '../database/mongo.helper.js';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,
  ) {}

  async findAll(): Promise<Category[]> {
    const docs = await this.categoryModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return toEntities(Category, docs);
  }

  async findById(id: string): Promise<Category | null> {
    const doc = await this.categoryModel.findOne({ id }).lean().exec();
    return toEntity(Category, doc);
  }

  async findByIdWithBooks(id: string): Promise<Category | null> {
    const doc = await this.categoryModel.findOne({ id }).lean().exec();
    const category = toEntity(Category, doc);
    if (!category) {
      return null;
    }
    const bookDocs = await this.bookModel
      .find({ categoryId: category.id })
      .lean()
      .exec();
    category.books = toEntities(Book, bookDocs);
    return category;
  }

  async findByName(name: string): Promise<Category | null> {
    const doc = await this.categoryModel.findOne({ name }).lean().exec();
    return toEntity(Category, doc);
  }

  async save(category: Category): Promise<Category> {
    const payload = prepareDocumentForSave(category);
    const saved = await this.categoryModel
      .findOneAndUpdate(
        { id: payload.id },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return toEntity(Category, saved) ?? category;
  }

  async delete(id: string): Promise<boolean> {
    await this.bookModel.updateMany({ categoryId: id }, { $set: { categoryId: null } }).exec();
    const result = await this.categoryModel.deleteOne({ id }).exec();
    return (result.deletedCount ?? 0) > 0;
  }
}
