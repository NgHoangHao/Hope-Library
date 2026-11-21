import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from '../model/author/author.entity.js';

@Injectable()
export class AuthorRepository {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepo: Repository<Author>,
  ) {}

  async findAll(): Promise<Author[]> {
    return this.authorRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Author | null> {
    return this.authorRepo.findOne({ where: { id } });
  }

  async findByIdWithBooks(id: string): Promise<Author | null> {
    return this.authorRepo.findOne({
      where: { id },
      relations: { books: true },
    });
  }

  async findByName(name: string): Promise<Author | null> {
    return this.authorRepo.findOne({ where: { name } });
  }

  async save(author: Author): Promise<Author> {
    return this.authorRepo.save(author);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.authorRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
