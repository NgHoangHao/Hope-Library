import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../model/category/category.entity.js';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.categoryRepo.findOne({ where: { id } });
  }

  async findByIdWithBooks(id: string): Promise<Category | null> {
    return this.categoryRepo.findOne({
      where: { id },
      relations: { books: true },
    });
  }

  async findByName(name: string): Promise<Category | null> {
    return this.categoryRepo.findOne({ where: { name } });
  }

  async save(category: Category): Promise<Category> {
    return this.categoryRepo.save(category);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.categoryRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
