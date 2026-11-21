import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapWith, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Author } from '../model/author/author.entity.js';
import {
  AuthorResponse,
  AuthorDetailResponse,
  CreateAuthorDto,
  UpdateAuthorDto,
} from '../model/author/author.dto.js';
import { Book } from '../model/book/book.entity.js';
import { BookDetailResponse } from '../model/book/book.dto.js';

@Injectable()
export class AuthorProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, Author, AuthorResponse);
      createMap(mapper, CreateAuthorDto, Author);
      createMap(mapper, UpdateAuthorDto, Author);
      createMap(
        mapper,
        Author,
        AuthorDetailResponse,
        forMember(
          (destination) => destination.books,
          mapWith(BookDetailResponse, Book, (source) => source.books ?? []),
        ),
      );
    };
  }

  toResponse(author: Author): AuthorResponse {
    return this.mapper.map(author, Author, AuthorResponse);
  }

  toResponseList(authors: Author[]): AuthorResponse[] {
    return this.mapper.mapArray(authors, Author, AuthorResponse);
  }

  toDetailResponse(author: Author): AuthorDetailResponse {
    return this.mapper.map(author, Author, AuthorDetailResponse);
  }
}

export { AuthorProfile as AuthorMapper };
