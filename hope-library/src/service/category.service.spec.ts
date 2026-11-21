import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMapper, type Mapper } from '@automapper/core';
import { classes } from '@automapper/classes';
import { CategoryService } from './category.service.js';
import { CategoryRepository } from '../repository/category.repository.js';
import { CategoryProfile } from '../mapper/category.mapper.js';
import { Category } from '../model/category/category.entity.js';
import { AppException } from '../common/index.js';

describe('CategoryService', () => {
  let service: CategoryService;
  let mapper: Mapper;
  let categoryRepo: Partial<Record<keyof CategoryRepository, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    mapper = createMapper({ strategyInitializer: classes() });
    new CategoryProfile(mapper);

    categoryRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByIdWithBooks: vi.fn(),
      findByName: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    service = new CategoryService(
      categoryRepo as unknown as CategoryRepository,
      mapper,
    );
  });

  describe('createCategory', () => {
    it('nên ném AppException nếu tên thể loại trống', async () => {
      await expect(service.createCategory({ name: '   ' })).rejects.toThrow(AppException);
    });

    it('nên ném AppException nếu tên thể loại đã tồn tại (conflict)', async () => {
      categoryRepo.findByName!.mockResolvedValue(new Category({ id: 'cat-1', name: 'Công nghệ' }));

      await expect(
        service.createCategory({ name: 'Công nghệ', description: 'Mô tả' }),
      ).rejects.toThrow(AppException);
    });

    it('nên tạo thể loại thành công', async () => {
      categoryRepo.findByName!.mockResolvedValue(null);
      categoryRepo.save!.mockImplementation(async (entity) => {
        return new Category({
          ...entity,
          id: 'cat-new-uuid',
        });
      });

      const result = await service.createCategory({
        name: 'Khoa học công nghệ',
        description: 'Sách KH&CN',
      });

      expect(categoryRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('cat-new-uuid');
      expect(result.name).toBe('Khoa học công nghệ');
      expect(result.description).toBe('Sách KH&CN');
    });
  });

  describe('getAllCategories', () => {
    it('nên trả về danh sách CategoryResponse[]', async () => {
      categoryRepo.findAll!.mockResolvedValue([
        new Category({ id: 'cat-1', name: 'Toán học' }),
        new Category({ id: 'cat-2', name: 'Văn học' }),
      ]);

      const result = await service.getAllCategories();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Toán học');
      expect(result[1].name).toBe('Văn học');
    });
  });

  describe('getCategoryById', () => {
    it('nên ném AppException nếu không tìm thấy thể loại', async () => {
      categoryRepo.findByIdWithBooks!.mockResolvedValue(null);

      await expect(service.getCategoryById('not-found-id')).rejects.toThrow(AppException);
    });

    it('nên trả về CategoryDetailResponse nếu tìm thấy', async () => {
      categoryRepo.findByIdWithBooks!.mockResolvedValue(
        new Category({
          id: 'cat-1',
          name: 'Khoa học',
          description: 'Sách KH',
          books: [],
        }),
      );

      const result = await service.getCategoryById('cat-1');
      expect(result.id).toBe('cat-1');
      expect(result.name).toBe('Khoa học');
      expect(result.books).toEqual([]);
    });
  });

  describe('updateCategory', () => {
    it('nên ném AppException nếu thể loại không tồn tại', async () => {
      categoryRepo.findById!.mockResolvedValue(null);

      await expect(
        service.updateCategory('not-found', { name: 'Mới' }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném AppException nếu tên thể loại mới bị trùng lặp', async () => {
      categoryRepo.findById!.mockResolvedValue(
        new Category({ id: 'cat-1', name: 'Tên cũ' }),
      );
      categoryRepo.findByName!.mockResolvedValue(
        new Category({ id: 'cat-2', name: 'Tên đã có' }),
      );

      await expect(
        service.updateCategory('cat-1', { name: 'Tên đã có' }),
      ).rejects.toThrow(AppException);
    });

    it('nên cập nhật thành công', async () => {
      categoryRepo.findById!.mockResolvedValue(
        new Category({ id: 'cat-1', name: 'Tên cũ', description: 'Mô tả cũ' }),
      );
      categoryRepo.findByName!.mockResolvedValue(null);
      categoryRepo.save!.mockImplementation(async (entity) => entity);

      const result = await service.updateCategory('cat-1', {
        name: 'Tên mới',
        description: 'Mô tả mới',
      });

      expect(result.name).toBe('Tên mới');
      expect(result.description).toBe('Mô tả mới');
    });
  });

  describe('deleteCategory', () => {
    it('nên ném AppException nếu không tìm thấy thể loại', async () => {
      categoryRepo.findByIdWithBooks!.mockResolvedValue(null);

      await expect(service.deleteCategory('not-found')).rejects.toThrow(AppException);
    });

    it('nên ném AppException nếu thể loại còn sách liên kết', async () => {
      categoryRepo.findByIdWithBooks!.mockResolvedValue(
        new Category({
          id: 'cat-1',
          name: 'Khoa học',
          books: [{ id: 'book-1' } as any],
        }),
      );

      await expect(service.deleteCategory('cat-1')).rejects.toThrow(AppException);
    });

    it('nên xóa thành công khi không còn sách liên kết', async () => {
      categoryRepo.findByIdWithBooks!.mockResolvedValue(
        new Category({
          id: 'cat-1',
          name: 'Khoa học',
          books: [],
        }),
      );
      categoryRepo.delete!.mockResolvedValue(true);

      await expect(service.deleteCategory('cat-1')).resolves.not.toThrow();
      expect(categoryRepo.delete).toHaveBeenCalledWith('cat-1');
    });
  });
});
