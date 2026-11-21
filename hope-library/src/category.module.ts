import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './model/category/category.entity.js';
import { Book, BookSchema } from './model/book/book.entity.js';
import { CategoryRepository } from './repository/category.repository.js';
import { CategoryService } from './service/category.service.js';
import { CategoryController } from './controller/category.controller.js';
import { CategoryMapper } from './mapper/index.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryRepository, CategoryService, CategoryMapper],
  exports: [CategoryService, CategoryRepository, CategoryMapper],
})
export class CategoryModule {}
