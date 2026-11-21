import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './model/category/category.entity.js';
import { Book } from './model/book/book.entity.js';
import { CategoryRepository } from './repository/category.repository.js';
import { CategoryService } from './service/category.service.js';
import { CategoryController } from './controller/category.controller.js';
import { CategoryMapper } from './mapper/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Category, Book])],
  controllers: [CategoryController],
  providers: [CategoryRepository, CategoryService, CategoryMapper],
  exports: [CategoryService, CategoryRepository, CategoryMapper],
})
export class CategoryModule {}
