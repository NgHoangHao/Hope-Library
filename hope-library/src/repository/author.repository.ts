import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Author } from '../model/author/author.entity.js';
import { Book } from '../model/book/book.entity.js';
import {
  prepareDocumentForSave,
  toEntities,
  toEntity,
} from '../database/mongo.helper.js';

@Injectable()
export class AuthorRepository {
  constructor(
    @InjectModel(Author.name)
    private readonly authorModel: Model<Author>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,
  ) {}

  async findAll(): Promise<Author[]> {
    const docs = await this.authorModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return toEntities(Author, docs);
  }

  async findById(id: string): Promise<Author | null> {
    const doc = await this.authorModel.findOne({ id }).lean().exec();
    return toEntity(Author, doc);
  }

  async findByIdWithBooks(id: string): Promise<Author | null> {
    const doc = await this.authorModel.findOne({ id }).lean().exec();
    const author = toEntity(Author, doc);
    if (!author) {
      return null;
    }
    const bookDocs = await this.bookModel
      .find({ authorId: author.id })
      .lean()
      .exec();
    author.books = toEntities(Book, bookDocs);
    return author;
  }

  async findByName(name: string): Promise<Author | null> {
    const doc = await this.authorModel.findOne({ name }).lean().exec();
    return toEntity(Author, doc);
  }

  async save(author: Author): Promise<Author> {
    const payload = prepareDocumentForSave(author);
    const saved = await this.authorModel
      .findOneAndUpdate(
        { id: payload.id },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return toEntity(Author, saved) ?? author;
  }

  async delete(id: string): Promise<boolean> {
    await this.bookModel.updateMany({ authorId: id }, { $set: { authorId: null } }).exec();
    const result = await this.authorModel.deleteOne({ id }).exec();
    return (result.deletedCount ?? 0) > 0;
  }
}
