import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './model/book/book.entity.js';
import { BookCopy } from './model/book-copy/book-copy.entity.js';
import { BookRepository } from './repository/book.repository.js';
import { BookService } from './service/book.service.js';
import { BookController } from './controller/book.controller.js';
import { FileStorageService } from './utils/file-storage.service.js';
import { BookMapper } from './mapper/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Book, BookCopy])],
  controllers: [BookController],
  providers: [BookRepository, BookService, FileStorageService, BookMapper],
  exports: [BookService, BookRepository, FileStorageService, BookMapper],
})
export class BookModule {}
