import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMapper, type Mapper } from '@automapper/core';
import { classes } from '@automapper/classes';
import { BookService } from './book.service.js';
import { BookRepository } from '../repository/book.repository.js';
import { FileStorageService } from '../utils/file-storage.service.js';
import { AppException } from '../common/index.js';
import { Book, BookStatus } from '../model/book/book.entity.js';
import { BookCopyStatus } from '../model/book-copy/book-copy.entity.js';
import { LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import { BookProfile } from '../mapper/book.mapper.js';

describe('BookService', () => {
  let service: BookService;
  let mapper: Mapper;
  let bookRepo: Partial<Record<keyof BookRepository, ReturnType<typeof vi.fn>>>;
  let fileStorageService: Partial<Record<keyof FileStorageService, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    mapper = createMapper({ strategyInitializer: classes() });
    const bookMapper = new BookProfile(mapper);

    bookRepo = {
      findByIsbn: vi.fn(),
      findCopiesByBarcodes: vi.fn(),
      createWithCopies: vi.fn(),
      updateWithCopies: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
      deleteBookWithRelations: vi.fn(),
      findTopReturnedBooks: vi.fn(),
    };

    fileStorageService = {
      validateImageFile: vi.fn(),
      saveImage: vi.fn(),
      deleteFile: vi.fn(),
    };

    service = new BookService(
      bookRepo as unknown as BookRepository,
      fileStorageService as unknown as FileStorageService,
      bookMapper,
    );
  });

  it('nên ném AppException nếu tiêu đề sách trống', async () => {
    await expect(service.createBook({ title: '' })).rejects.toThrow(AppException);
  });

  it('nên ném AppException nếu ISBN bị trùng lặp', async () => {
    bookRepo.findByIsbn!.mockResolvedValue({ id: '1', title: 'Existing' } as any);

    await expect(
      service.createBook({ title: 'New Book', isbn: '123-456' }),
    ).rejects.toThrow(AppException);
  });

  it('nên ném AppException nếu danh sách copies có barcode trùng lặp', async () => {
    await expect(
      service.createBook({
        title: 'New Book',
        copies: [
          { barcode: 'BC001', shelfLocation: 'A1' },
          { barcode: 'BC001', shelfLocation: 'A2' },
        ],
      }),
    ).rejects.toThrow(AppException);
  });

  it('nên tạo sách thành công kèm bản sao và lưu ảnh', async () => {
    bookRepo.findByIsbn!.mockResolvedValue(null);
    bookRepo.findCopiesByBarcodes!.mockResolvedValue([]);
    fileStorageService.saveImage!.mockResolvedValue({
      fileName: 'book-cover.png',
      filePath: 'E:\\hope-library-uploads\\books\\book-cover.png',
      fileUrl: '/uploads/books/book-cover.png',
    });

    bookRepo.createWithCopies!.mockResolvedValue({
      id: 'book-uuid',
      title: 'Clean Code',
      isbn: '978-0132350884',
      bookUrl: '/uploads/books/book-cover.png',
      totalCopies: 1,
      availableCopies: 1,
      status: BookStatus.ACTIVE,
      copies: [
        {
          id: 'copy-uuid',
          bookId: 'book-uuid',
          barcode: 'BC001',
          shelfLocation: 'A1',
          status: BookCopyStatus.AVAILABLE,
        },
      ],
    } as any);

    const mockFile = {
      originalname: 'cover.png',
      mimetype: 'image/png',
      buffer: Buffer.from('image-bytes'),
    } as Express.Multer.File;

    const result = await service.createBook(
      {
        title: 'Clean Code',
        isbn: '978-0132350884',
        copies: [{ barcode: 'BC001', shelfLocation: 'A1' }],
      },
      mockFile,
    );

    expect(fileStorageService.saveImage).toHaveBeenCalledWith(mockFile, 'books');
    expect(bookRepo.createWithCopies).toHaveBeenCalled();
    expect(result.id).toBe('book-uuid');
    expect(result.bookUrl).toBe('/uploads/books/book-cover.png');
    expect(result.totalCopies).toBe(1);
    expect(result.copies).toHaveLength(1);
  });

  describe('updateBook', () => {
    it('nên ném AppException nếu không tìm thấy sách', async () => {
      bookRepo.findById!.mockResolvedValue(null);

      await expect(service.updateBook('invalid-id', { title: 'Updated' })).rejects.toThrow(
        AppException,
      );
    });

    it('nếu file ảnh nhận vào null hoặc undefined thì không thay đổi ảnh (không gọi saveImage)', async () => {
      const existingBook = {
        id: 'book-uuid',
        title: 'Original Title',
        bookUrl: '/uploads/books/original.png',
        copies: [],
      };
      bookRepo.findById!.mockResolvedValue(existingBook as any);
      bookRepo.updateWithCopies!.mockResolvedValue({
        ...existingBook,
        title: 'Updated Title',
      } as any);

      const result = await service.updateBook(
        'book-uuid',
        { title: 'Updated Title' },
        undefined, // ảnh là undefined/null
      );

      expect(fileStorageService.saveImage).not.toHaveBeenCalled();
      expect(bookRepo.updateWithCopies).toHaveBeenCalledWith(
        'book-uuid',
        expect.not.objectContaining({ bookUrl: expect.anything() }),
        undefined,
      );
      expect(result.title).toBe('Updated Title');
      expect(result.bookUrl).toBe('/uploads/books/original.png');
    });

    it('nếu có file ảnh mới thì lưu ảnh mới và xóa ảnh cũ', async () => {
      const existingBook = {
        id: 'book-uuid',
        title: 'Original Title',
        bookUrl: '/uploads/books/old-cover.png',
        copies: [],
      };
      bookRepo.findById!.mockResolvedValue(existingBook as any);
      fileStorageService.saveImage!.mockResolvedValue({
        fileName: 'new-cover.png',
        filePath: 'E:\\hope-library-uploads\\books\\new-cover.png',
        fileUrl: '/uploads/books/new-cover.png',
      });
      bookRepo.updateWithCopies!.mockResolvedValue({
        ...existingBook,
        bookUrl: '/uploads/books/new-cover.png',
      } as any);

      const mockFile = {
        originalname: 'new-cover.png',
        mimetype: 'image/png',
        buffer: Buffer.from('new-image-bytes'),
      } as Express.Multer.File;

      const result = await service.updateBook('book-uuid', {}, mockFile);

      expect(fileStorageService.saveImage).toHaveBeenCalledWith(mockFile, 'books');
      expect(fileStorageService.deleteFile).toHaveBeenCalledWith('/uploads/books/old-cover.png');
      expect(result.bookUrl).toBe('/uploads/books/new-cover.png');
    });

    it('cập nhật sách cùng danh sách bản sao (copyBook)', async () => {
      const existingBook = {
        id: 'book-uuid',
        title: 'Original Title',
        bookUrl: '/uploads/books/cover.png',
        copies: [],
      };
      bookRepo.findById!.mockResolvedValue(existingBook as any);
      bookRepo.findCopiesByBarcodes!.mockResolvedValue([]);
      bookRepo.updateWithCopies!.mockResolvedValue({
        ...existingBook,
        title: 'Book with copies',
        copies: [
          {
            id: 'copy-1',
            bookId: 'book-uuid',
            barcode: 'BC001',
            shelfLocation: 'A1',
            status: BookCopyStatus.AVAILABLE,
          },
        ],
        totalCopies: 1,
        availableCopies: 1,
      } as any);

      const result = await service.updateBook('book-uuid', {
        title: 'Book with copies',
        copies: [{ barcode: 'BC001', shelfLocation: 'A1' }],
      });

      expect(bookRepo.updateWithCopies).toHaveBeenCalledWith(
        'book-uuid',
        expect.objectContaining({ title: 'Book with copies' }),
        expect.arrayContaining([
          expect.objectContaining({ barcode: 'BC001', shelfLocation: 'A1' }),
        ]),
      );
      expect(result.copies).toHaveLength(1);
    });

    it('ném AppException nếu danh sách bản sao có barcode thuộc về sách khác', async () => {
      const existingBook = {
        id: 'book-uuid',
        title: 'Book 1',
        copies: [],
      };
      bookRepo.findById!.mockResolvedValue(existingBook as any);
      bookRepo.findCopiesByBarcodes!.mockResolvedValue([
        {
          id: 'copy-other',
          bookId: 'other-book-uuid',
          barcode: 'BC999',
        } as any,
      ]);

      await expect(
        service.updateBook('book-uuid', {
          copies: [{ barcode: 'BC999' }],
        }),
      ).rejects.toThrow(AppException);
    });
  });

  describe('deleteBook', () => {
    it('ném AppException nếu ID rỗng hoặc khoảng trắng', async () => {
      await expect(service.deleteBook('')).rejects.toThrow(AppException);
      await expect(service.deleteBook('   ')).rejects.toThrow(AppException);
    });

    it('ném AppException nếu không tìm thấy sách', async () => {
      bookRepo.findById!.mockResolvedValue(null);

      await expect(service.deleteBook('non-existent-id')).rejects.toThrow(AppException);
    });

    it('ném AppException nếu sách có bản sao đang có trạng thái BORROWED', async () => {
      bookRepo.findById!.mockResolvedValue({
        id: 'book-1',
        title: 'Book 1',
        copies: [
          {
            id: 'copy-1',
            barcode: 'BC001',
            status: BookCopyStatus.BORROWED,
          },
        ],
      } as any);

      await expect(service.deleteBook('book-1')).rejects.toThrow(AppException);
    });

    it('ném AppException nếu sách có bản sao đang có trạng thái RESERVED', async () => {
      bookRepo.findById!.mockResolvedValue({
        id: 'book-1',
        title: 'Book 1',
        copies: [
          {
            id: 'copy-1',
            barcode: 'BC001',
            status: BookCopyStatus.RESERVED,
          },
        ],
      } as any);

      await expect(service.deleteBook('book-1')).rejects.toThrow(AppException);
    });

    it('ném AppException nếu bản sao có mục mượn LoanItem đang ở trạng thái BORROWED', async () => {
      bookRepo.findById!.mockResolvedValue({
        id: 'book-1',
        title: 'Book 1',
        copies: [
          {
            id: 'copy-1',
            barcode: 'BC001',
            status: BookCopyStatus.AVAILABLE,
            loanItems: [
              {
                id: 'loan-item-1',
                status: LoanItemStatus.BORROWED,
              },
            ],
          },
        ],
      } as any);

      await expect(service.deleteBook('book-1')).rejects.toThrow(AppException);
    });

    it('xóa sách và file ảnh thành công khi tất cả bản sao không bị mượn', async () => {
      bookRepo.findById!.mockResolvedValue({
        id: 'book-1',
        title: 'Book 1',
        bookUrl: '/uploads/books/cover.png',
        copies: [
          {
            id: 'copy-1',
            barcode: 'BC001',
            status: BookCopyStatus.AVAILABLE,
            loanItems: [
              {
                id: 'loan-item-1',
                status: LoanItemStatus.RETURNED,
              },
            ],
          },
        ],
      } as any);
      bookRepo.deleteBookWithRelations!.mockResolvedValue(true);
      fileStorageService.deleteFile!.mockResolvedValue(true);

      await expect(service.deleteBook('book-1')).resolves.not.toThrow();

      expect(bookRepo.deleteBookWithRelations).toHaveBeenCalledWith('book-1');
      expect(fileStorageService.deleteFile).toHaveBeenCalledWith('/uploads/books/cover.png');
    });

    it('xóa sách thành công khi sách không có bản sao nào', async () => {
      bookRepo.findById!.mockResolvedValue({
        id: 'book-1',
        title: 'Book 1',
        bookUrl: null,
        copies: [],
      } as any);
      bookRepo.deleteBookWithRelations!.mockResolvedValue(true);

      await expect(service.deleteBook('book-1')).resolves.not.toThrow();

      expect(bookRepo.deleteBookWithRelations).toHaveBeenCalledWith('book-1');
      expect(fileStorageService.deleteFile).not.toHaveBeenCalled();
    });

    it('ném AppException nếu thao tác xóa trong repository thất bại', async () => {
      bookRepo.findById!.mockResolvedValue({
        id: 'book-1',
        title: 'Book 1',
        copies: [],
      } as any);
      bookRepo.deleteBookWithRelations!.mockResolvedValue(false);

      await expect(service.deleteBook('book-1')).rejects.toThrow(AppException);
    });
  });

  describe('getTopReturnedBooks', () => {
    it('trả về danh sách BookResponse mapped từ danh sách Entity', async () => {
      const mockEntities = [
        new Book({
          id: 'b1',
          title: 'Clean Code',
          totalCopies: 5,
          availableCopies: 3,
          status: BookStatus.ACTIVE,
        }),
        new Book({
          id: 'b2',
          title: 'Design Patterns',
          totalCopies: 4,
          availableCopies: 2,
          status: BookStatus.ACTIVE,
        }),
      ];
      bookRepo.findTopReturnedBooks!.mockResolvedValue(mockEntities);

      const result = await service.getTopReturnedBooks(4);

      expect(bookRepo.findTopReturnedBooks).toHaveBeenCalledWith(4);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('b1');
      expect(result[0].title).toBe('Clean Code');
      expect(result[1].id).toBe('b2');
      expect(result[1].title).toBe('Design Patterns');
    });

    it('fallback về limit mặc định là 4 nếu tham số limit <= 0 hoặc không hợp lệ', async () => {
      bookRepo.findTopReturnedBooks!.mockResolvedValue([]);

      await service.getTopReturnedBooks(-1);

      expect(bookRepo.findTopReturnedBooks).toHaveBeenCalledWith(4);
    });
  });
});
