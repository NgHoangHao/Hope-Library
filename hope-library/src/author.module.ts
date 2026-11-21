import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Author } from './model/author/author.entity.js';
import { Book } from './model/book/book.entity.js';
import { AuthorRepository } from './repository/author.repository.js';
import { AuthorService } from './service/author.service.js';
import { AuthorController } from './controller/author.controller.js';
import { AuthorMapper } from './mapper/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Author, Book])],
  controllers: [AuthorController],
  providers: [AuthorRepository, AuthorService, AuthorMapper],
  exports: [AuthorService, AuthorRepository, AuthorMapper],
})
export class AuthorModule {}
