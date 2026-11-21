import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './model/book/book.entity.js';
import { BookCopy, BookCopySchema } from './model/book-copy/book-copy.entity.js';
import { Author, AuthorSchema } from './model/author/author.entity.js';
import { Category, CategorySchema } from './model/category/category.entity.js';
import { LoanItem, LoanItemSchema } from './model/loan-item/loan-item.entity.js';
import { Loan, LoanSchema } from './model/loan/loan.entity.js';
import { Fine, FineSchema } from './model/fine/fine.entity.js';
import { BookRepository } from './repository/book.repository.js';
import { BookService } from './service/book.service.js';
import { BookController } from './controller/book.controller.js';
import { FileStorageService } from './utils/file-storage.service.js';
import { BookMapper } from './mapper/index.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: BookCopy.name, schema: BookCopySchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Category.name, schema: CategorySchema },
      { name: LoanItem.name, schema: LoanItemSchema },
      { name: Loan.name, schema: LoanSchema },
      { name: Fine.name, schema: FineSchema },
    ]),
  ],
  controllers: [BookController],
  providers: [BookRepository, BookService, FileStorageService, BookMapper],
  exports: [BookService, BookRepository, FileStorageService, BookMapper],
})
export class BookModule {}
