import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapWith, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Book } from '../model/book/book.entity.js';
import {
  BookDetailResponse,
  BookResponse,
  CreateBookDto,
  UpdateBookDto,
  PaginatedBookResponse,
} from '../model/book/book.dto.js';
import { BookCopy } from '../model/book-copy/book-copy.entity.js';
import {
  BookCopyResponse,
  CreateBookCopyDto,
  UpdateBookCopyDto,
} from '../model/book-copy/book-copy.dto.js';
import { Author } from '../model/author/author.entity.js';
import { AuthorResponse } from '../model/author/author.dto.js';
import { Category } from '../model/category/category.entity.js';
import { CategoryResponse } from '../model/category/category.dto.js';

@Injectable()
export class BookProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, BookCopy, BookCopyResponse);
      createMap(mapper, CreateBookCopyDto, BookCopy);
      createMap(mapper, UpdateBookCopyDto, BookCopy);
      createMap(
        mapper,
        Book,
        BookDetailResponse,
        forMember(
          (destination) => destination.author,
          mapWith(AuthorResponse, Author, (source) => source.author),
        ),
        forMember(
          (destination) => destination.category,
          mapWith(CategoryResponse, Category, (source) => source.category),
        ),
        forMember(
          (destination) => destination.copies,
          mapWith(BookCopyResponse, BookCopy, (source) => source.copies ?? []),
        ),
      );
      createMap(mapper, CreateBookDto, Book);
      createMap(mapper, UpdateBookDto, Book);
      createMap(
        mapper,
        Book,
        BookResponse,
        forMember(
          (destination) => destination.author,
          mapWith(AuthorResponse, Author, (source) => source.author),
        ),
        forMember(
          (destination) => destination.category,
          mapWith(CategoryResponse, Category, (source) => source.category),
        ),
      );
    };
  }

  toResponse(book: Book): BookResponse {
    return this.mapper.map(book, Book, BookResponse);
  }

  toResponseList(books: Book[]): BookResponse[] {
    return this.mapper.mapArray(books, Book, BookResponse);
  }

  toPaginatedResponse(
    books: Book[],
    total: number,
    page: number,
    size: number,
  ): PaginatedBookResponse {
    const items = this.toResponseList(books);
    const totalPages = size > 0 ? Math.ceil(total / size) : 0;
    return new PaginatedBookResponse({
      items,
      page,
      size,
      total,
      totalItems: total,
      totalPages,
    });
  }

  toListResponse(book: Book): BookResponse {
    return this.mapper.map(book, Book, BookResponse);
  }

  toDetailResponse(book: Book): BookDetailResponse {
    return this.mapper.map(book, Book, BookDetailResponse);
  }

  toDetailResponseList(books: Book[]): BookDetailResponse[] {
    return this.mapper.mapArray(books, Book, BookDetailResponse);
  }

  toEntity(dto: CreateBookDto): Book {
    return this.mapper.map(dto, CreateBookDto, Book);
  }

  toUpdateEntity(dto: UpdateBookDto): Book {
    return this.mapper.map(dto, UpdateBookDto, Book);
  }

  toCopyResponse(copy: BookCopy): BookCopyResponse {
    return this.mapper.map(copy, BookCopy, BookCopyResponse);
  }

  toCopyResponseList(copies: BookCopy[]): BookCopyResponse[] {
    return this.mapper.mapArray(copies, BookCopy, BookCopyResponse);
  }

  toCopyEntity(dto: CreateBookCopyDto): BookCopy {
    return this.mapper.map(dto, CreateBookCopyDto, BookCopy);
  }

  toUpdateCopyEntity(dto: UpdateBookCopyDto): BookCopy {
    return this.mapper.map(dto, UpdateBookCopyDto, BookCopy);
  }
}

export { BookProfile as BookMapper };
