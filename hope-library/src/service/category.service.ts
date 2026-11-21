import { Injectable } from '@nestjs/common';
import { InjectMapper } from '@automapper/nestjs';
import { type Mapper } from '@automapper/core';
import { CategoryRepository } from '../repository/category.repository.js';
import { Category } from '../model/category/category.entity.js';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponse,
  CategoryDetailResponse,
} from '../model/category/category.dto.js';
import { AppException } from '../common/index.js';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepo: CategoryRepository,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  get categoryRepository(): CategoryRepository {
    return this.categoryRepo;
  }

  /**
   * Lấy danh sách tất cả thể loại, map sang CategoryResponse[]
   */
  async getAllCategories(): Promise<CategoryResponse[]> {
    const categories = await this.categoryRepo.findAll();
    return this.mapper.mapArray(categories, Category, CategoryResponse);
  }

  /**
   * Lấy chi tiết thể loại theo ID kèm danh sách sách liên kết, map sang CategoryDetailResponse
   */
  async getCategoryById(id: string): Promise<CategoryDetailResponse> {
    const category = await this.categoryRepo.findByIdWithBooks(id);
    if (!category) {
      throw AppException.notFound(
        `Không tìm thấy thể loại với ID: ${id}`,
        { id },
        'CATEGORY_NOT_FOUND',
      );
    }
    return this.mapper.map(category, Category, CategoryDetailResponse);
  }

  /**
   * Thêm mới thể loại sách (name, description)
   */
  async createCategory(dto: CreateCategoryDto): Promise<CategoryResponse> {
    if (!dto.name || !dto.name.trim()) {
      throw AppException.badRequest(
        'Tên thể loại không được để trống',
        { field: 'name' },
        'CATEGORY_NAME_REQUIRED',
      );
    }

    const trimmedName = dto.name.trim();
    const existing = await this.categoryRepo.findByName(trimmedName);
    if (existing) {
      throw AppException.conflict(
        `Tên thể loại '${trimmedName}' đã tồn tại trong hệ thống`,
        { name: trimmedName },
        'CATEGORY_NAME_CONFLICT',
      );
    }

    const category = this.mapper.map(dto, CreateCategoryDto, Category);
    category.name = trimmedName;
    if (dto.description !== undefined) {
      category.description = dto.description?.trim() || null;
    }

    const savedCategory = await this.categoryRepo.save(category);
    return this.mapper.map(savedCategory, Category, CategoryResponse);
  }

  /**
   * Cập nhật thông tin thể loại
   */
  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<CategoryResponse> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw AppException.notFound(
        `Không tìm thấy thể loại với ID: ${id}`,
        { id },
        'CATEGORY_NOT_FOUND',
      );
    }

    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw AppException.badRequest(
          'Tên thể loại không hợp lệ',
          { field: 'name' },
          'INVALID_CATEGORY_NAME',
        );
      }

      const trimmedName = dto.name.trim();
      if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
        const existing = await this.categoryRepo.findByName(trimmedName);
        if (existing && existing.id !== id) {
          throw AppException.conflict(
            `Tên thể loại '${trimmedName}' đã tồn tại trong hệ thống`,
            { name: trimmedName },
            'CATEGORY_NAME_CONFLICT',
          );
        }
      }
      category.name = trimmedName;
    }

    if (dto.description !== undefined) {
      category.description = dto.description?.trim() || null;
    }

    category.updatedAt = new Date();
    const updatedCategory = await this.categoryRepo.save(category);
    return this.mapper.map(updatedCategory, Category, CategoryResponse);
  }

  /**
   * Xóa thể loại theo ID
   */
  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepo.findByIdWithBooks(id);
    if (!category) {
      throw AppException.notFound(
        `Không tìm thấy thể loại với ID: ${id}`,
        { id },
        'CATEGORY_NOT_FOUND',
      );
    }

    if (category.books && category.books.length > 0) {
      throw AppException.badRequest(
        `Không thể xóa thể loại vì vẫn còn ${category.books.length} cuốn sách liên kết`,
        { id, bookCount: category.books.length },
        'CATEGORY_HAS_ASSOCIATED_BOOKS',
      );
    }

    const isDeleted = await this.categoryRepo.delete(id);
    if (!isDeleted) {
      throw AppException.badRequest(
        `Xóa thể loại thất bại với ID: ${id}`,
        { id },
        'DELETE_CATEGORY_FAILED',
      );
    }
  }
}
