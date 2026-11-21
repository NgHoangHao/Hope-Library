import { Injectable } from '@nestjs/common';
import { InjectMapper } from '@automapper/nestjs';
import { type Mapper } from '@automapper/core';
import { AuthorRepository } from '../repository/author.repository.js';
import { Author } from '../model/author/author.entity.js';
import {
  CreateAuthorDto,
  UpdateAuthorDto,
  AuthorResponse,
  AuthorDetailResponse,
} from '../model/author/author.dto.js';
import { AppException } from '../common/index.js';

@Injectable()
export class AuthorService {
  constructor(
    private readonly authorRepo: AuthorRepository,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  get authorRepository(): AuthorRepository {
    return this.authorRepo;
  }

  /**
   * Lấy danh sách tất cả tác giả, map sang AuthorResponse[]
   */
  async getAllAuthors(): Promise<AuthorResponse[]> {
    const authors = await this.authorRepo.findAll();
    return this.mapper.mapArray(authors, Author, AuthorResponse);
  }

  /**
   * Lấy chi tiết tác giả theo ID kèm danh sách sách đã sáng tác, map sang AuthorDetailResponse
   */
  async getAuthorById(id: string): Promise<AuthorDetailResponse> {
    const author = await this.authorRepo.findByIdWithBooks(id);
    if (!author) {
      throw AppException.notFound(
        `Không tìm thấy tác giả với ID: ${id}`,
        { id },
        'AUTHOR_NOT_FOUND',
      );
    }
    return this.mapper.map(author, Author, AuthorDetailResponse);
  }

  /**
   * Thêm mới tác giả (name, biography)
   */
  async createAuthor(dto: CreateAuthorDto): Promise<AuthorResponse> {
    if (!dto.name || !dto.name.trim()) {
      throw AppException.badRequest(
        'Tên tác giả không được để trống',
        { field: 'name' },
        'AUTHOR_NAME_REQUIRED',
      );
    }

    const trimmedName = dto.name.trim();
    const existing = await this.authorRepo.findByName(trimmedName);
    if (existing) {
      throw AppException.conflict(
        `Tên tác giả '${trimmedName}' đã tồn tại trong hệ thống`,
        { name: trimmedName },
        'AUTHOR_NAME_CONFLICT',
      );
    }

    const author = this.mapper.map(dto, CreateAuthorDto, Author);
    author.name = trimmedName;
    if (dto.biography !== undefined) {
      author.biography = dto.biography?.trim() || null;
    }

    const savedAuthor = await this.authorRepo.save(author);
    return this.mapper.map(savedAuthor, Author, AuthorResponse);
  }

  /**
   * Cập nhật thông tin tác giả
   */
  async updateAuthor(id: string, dto: UpdateAuthorDto): Promise<AuthorResponse> {
    const author = await this.authorRepo.findById(id);
    if (!author) {
      throw AppException.notFound(
        `Không tìm thấy tác giả với ID: ${id}`,
        { id },
        'AUTHOR_NOT_FOUND',
      );
    }

    if (dto.name !== undefined) {
      if (!dto.name.trim()) {
        throw AppException.badRequest(
          'Tên tác giả không hợp lệ',
          { field: 'name' },
          'INVALID_AUTHOR_NAME',
        );
      }

      const trimmedName = dto.name.trim();
      if (trimmedName.toLowerCase() !== author.name.toLowerCase()) {
        const existing = await this.authorRepo.findByName(trimmedName);
        if (existing && existing.id !== id) {
          throw AppException.conflict(
            `Tên tác giả '${trimmedName}' đã tồn tại trong hệ thống`,
            { name: trimmedName },
            'AUTHOR_NAME_CONFLICT',
          );
        }
      }
      author.name = trimmedName;
    }

    if (dto.biography !== undefined) {
      author.biography = dto.biography?.trim() || null;
    }

    author.updatedAt = new Date();
    const updatedAuthor = await this.authorRepo.save(author);
    return this.mapper.map(updatedAuthor, Author, AuthorResponse);
  }

  /**
   * Xóa tác giả theo ID
   */
  async deleteAuthor(id: string): Promise<void> {
    const author = await this.authorRepo.findByIdWithBooks(id);
    if (!author) {
      throw AppException.notFound(
        `Không tìm thấy tác giả với ID: ${id}`,
        { id },
        'AUTHOR_NOT_FOUND',
      );
    }

    if (author.books && author.books.length > 0) {
      throw AppException.badRequest(
        `Không thể xóa tác giả vì vẫn còn ${author.books.length} cuốn sách liên kết`,
        { id, bookCount: author.books.length },
        'AUTHOR_HAS_ASSOCIATED_BOOKS',
      );
    }

    const isDeleted = await this.authorRepo.delete(id);
    if (!isDeleted) {
      throw AppException.badRequest(
        `Xóa tác giả thất bại với ID: ${id}`,
        { id },
        'DELETE_AUTHOR_FAILED',
      );
    }
  }
}
