import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapWith, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Category } from '../model/category/category.entity.js';
import {
  CategoryResponse,
  CategoryDetailResponse,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../model/category/category.dto.js';
import { Book } from '../model/book/book.entity.js';
import { BookDetailResponse } from '../model/book/book.dto.js';

@Injectable()
export class CategoryProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, Category, CategoryResponse);
      createMap(mapper, CreateCategoryDto, Category);
      createMap(mapper, UpdateCategoryDto, Category);
      createMap(
        mapper,
        Category,
        CategoryDetailResponse,
        forMember(
          (destination) => destination.books,
          mapWith(BookDetailResponse, Book, (source) => source.books ?? []),
        ),
      );
    };
  }

  toResponse(category: Category): CategoryResponse {
    return this.mapper.map(category, Category, CategoryResponse);
  }

  toResponseList(categories: Category[]): CategoryResponse[] {
    return this.mapper.mapArray(categories, Category, CategoryResponse);
  }

  toDetailResponse(category: Category): CategoryDetailResponse {
    return this.mapper.map(category, Category, CategoryDetailResponse);
  }
}

export { CategoryProfile as CategoryMapper };
