import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Author, AuthorSchema } from './model/author/author.entity.js';
import { Book, BookSchema } from './model/book/book.entity.js';
import { AuthorRepository } from './repository/author.repository.js';
import { AuthorService } from './service/author.service.js';
import { AuthorController } from './controller/author.controller.js';
import { AuthorMapper } from './mapper/index.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Author.name, schema: AuthorSchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [AuthorController],
  providers: [AuthorRepository, AuthorService, AuthorMapper],
  exports: [AuthorService, AuthorRepository, AuthorMapper],
})
export class AuthorModule {}
