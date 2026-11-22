import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreamableFile } from '@nestjs/common';
import { BookController } from './book.controller.js';
import { BookService } from '../service/book.service.js';
import { AppException, ApiResponse } from '../common/index.js';

describe('BookController', () => {
  let controller: BookController;
  let bookService: Partial<Record<keyof BookService, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    bookService = {
      createBook: vi.fn(),
      getAllBooks: vi.fn(),
      getBookById: vi.fn(),
      getBookPdf: vi.fn(),
      updateBook: vi.fn(),
      deleteBook: vi.fn(),
      getTopReturnedBooks: vi.fn(),
    };

    controller = new BookController(bookService as unknown as BookService);
  });

  describe('createBook', () => {
    it('thêm sách thành công kèm file ảnh bìa và file PDF nội dung sách', async () => {
      const mockResult = {
        id: 'book-1',
        title: 'Clean Code',
        bookUrl: 'https://res.cloudinary.com/demo/image/upload/v1/hope-library/books/cover.png',
        pdfUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/hope-library/books/pdfs/book.pdf',
      };
      bookService.createBook!.mockResolvedValue(mockResult);

      const mockImage = {
        originalname: 'cover.png',
        mimetype: 'image/png',
        buffer: Buffer.from('img'),
      } as Express.Multer.File;

      const mockPdf = {
        originalname: 'clean-code.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 content'),
      } as Express.Multer.File;

      const response = await controller.createBook(
        { title: 'Clean Code' },
        { image: [mockImage], pdf: [mockPdf] },
      );

      expect(bookService.createBook).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Clean Code',
          image: mockImage,
          pdf: mockPdf,
        }),
        mockImage,
        mockPdf,
      );
      expect(response).toBeInstanceOf(ApiResponse);
      expect(response.response).toEqual(mockResult);
    });
  });

  describe('getBookById & viewBookPdf', () => {
    it('trả về chi tiết sách bao gồm pdfUrl', async () => {
      const mockDetail = {
        id: 'book-1',
        title: 'Clean Code',
        pdfUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/hope-library/books/pdfs/book.pdf',
      };
      bookService.getBookById!.mockResolvedValue(mockDetail);

      const response = await controller.getBookById('book-1');

      expect(bookService.getBookById).toHaveBeenCalledWith('book-1');
      expect(response.response).toEqual(mockDetail);
    });

    it('trả về StreamableFile PDF inline cho người dùng xem trực tiếp', async () => {
      bookService.getBookPdf!.mockResolvedValue({
        buffer: Buffer.from('%PDF-1.4'),
        fileName: 'Clean Code.pdf',
        pdfUrl: 'https://res.cloudinary.com/demo/raw/upload/v1/hope-library/books/pdfs/book.pdf',
      });

      const streamable = await controller.viewBookPdf('book-1');

      expect(bookService.getBookPdf).toHaveBeenCalledWith('book-1');
      expect(streamable).toBeInstanceOf(StreamableFile);
      expect(streamable.getHeaders().type).toBe('application/pdf');
      expect(streamable.getHeaders().disposition).toContain('inline');
    });
  });

  describe('updateBook', () => {
    it('cập nhật sách thành công khi gửi multipart/form-data có file ảnh và copies là JSON string', async () => {
      const mockResult = {
        id: 'book-1',
        title: 'Updated Title',
        bookUrl: '/uploads/books/new.png',
        copies: [{ id: 'copy-1', barcode: 'BC001', shelfLocation: 'A1' }],
      };
      bookService.updateBook!.mockResolvedValue(mockResult);

      const mockFile = {
        originalname: 'new.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const body = {
        title: 'Updated Title',
        copies: JSON.stringify([{ barcode: 'BC001', shelfLocation: 'A1' }]),
      };

      const response = await controller.updateBook('book-1', body, { image: [mockFile] });

      expect(bookService.updateBook).toHaveBeenCalledWith(
        'book-1',
        expect.objectContaining({
          title: 'Updated Title',
          copies: [{ barcode: 'BC001', shelfLocation: 'A1' }],
          image: mockFile,
          pdf: undefined,
        }),
        mockFile,
        undefined,
      );
      expect(response).toBeInstanceOf(ApiResponse);
      expect(response.response).toEqual(mockResult);
      expect(response.message).toBe('Cập nhật thông tin sách thành công');
    });

    it('nếu file ảnh nhận vào null hoặc không gửi thì không thay đổi ảnh (imageFile là undefined/null)', async () => {
      const mockResult = {
        id: 'book-1',
        title: 'Updated Title Only',
        bookUrl: '/uploads/books/old.png',
      };
      bookService.updateBook!.mockResolvedValue(mockResult);

      const body = {
        title: 'Updated Title Only',
      };

      const response = await controller.updateBook('book-1', body, undefined);

      expect(bookService.updateBook).toHaveBeenCalledWith(
        'book-1',
        expect.objectContaining({
          title: 'Updated Title Only',
          image: undefined,
          pdf: undefined,
        }),
        undefined,
        undefined,
      );
      expect(response.response).toEqual(mockResult);
    });

    it('nhận danh sách copies dưới dạng mảng JavaScript (Array)', async () => {
      const mockResult = { id: 'book-1' };
      bookService.updateBook!.mockResolvedValue(mockResult);

      const body = {
        copies: [{ barcode: 'BC002' }],
      };

      await controller.updateBook('book-1', body);

      expect(bookService.updateBook).toHaveBeenCalledWith(
        'book-1',
        expect.objectContaining({
          copies: [{ barcode: 'BC002' }],
        }),
        undefined,
        undefined,
      );
    });

    it('ném AppException nếu chuỗi JSON của copies không hợp lệ hoặc không phải mảng', async () => {
      await expect(
        controller.updateBook('book-1', { copies: '{ invalid json }' }),
      ).rejects.toThrow(AppException);

      await expect(
        controller.updateBook('book-1', { copies: JSON.stringify({ barcode: 'BC001' }) }),
      ).rejects.toThrow(AppException);
    });

    it('truyền đầy đủ status, barcode và location của copies xuống service', async () => {
      const mockResult = { id: 'book-1' };
      bookService.updateBook!.mockResolvedValue(mockResult);

      const copiesPayload = [
        { id: 'copy-1', barcode: 'BC-NEW', location: 'Kệ C3', status: 'MAINTENANCE' },
      ];
      await controller.updateBook('book-1', { copies: JSON.stringify(copiesPayload) });

      expect(bookService.updateBook).toHaveBeenCalledWith(
        'book-1',
        expect.objectContaining({
          copies: copiesPayload,
        }),
        undefined,
        undefined,
      );
    });
  });

  describe('deleteBook', () => {
    it('gọi bookService.deleteBook và trả về ApiResponse thành công', async () => {
      bookService.deleteBook!.mockResolvedValue(undefined);

      const response = await controller.deleteBook('book-1');

      expect(bookService.deleteBook).toHaveBeenCalledWith('book-1');
      expect(response).toBeInstanceOf(ApiResponse);
      expect(response.message).toBe('Xóa sách thành công');
      expect(response.response).toBeNull();
    });

    it('ném ngoại lệ nếu bookService.deleteBook thất bại', async () => {
      bookService.deleteBook!.mockRejectedValue(
        AppException.badRequest('Không thể xóa sách vì có bản sao đang được mượn', {}, 'CANNOT_DELETE_BORROWED_BOOK'),
      );

      await expect(controller.deleteBook('book-1')).rejects.toThrow(AppException);
    });
  });

  describe('getTopReturnedBooks', () => {
    it('trả về danh sách top 4 sách có lượt RETURNED nhiều nhất thành công', async () => {
      const mockBooks = [
        { id: 'b1', title: 'Book 1' },
        { id: 'b2', title: 'Book 2' },
        { id: 'b3', title: 'Book 3' },
        { id: 'b4', title: 'Book 4' },
      ];
      bookService.getTopReturnedBooks!.mockResolvedValue(mockBooks as any);

      const response = await controller.getTopReturnedBooks();

      expect(bookService.getTopReturnedBooks).toHaveBeenCalledWith(4);
      expect(response).toBeInstanceOf(ApiResponse);
      expect(response.response).toEqual(mockBooks);
      expect(response.message).toBe('Lấy danh sách top sách mượn trả nhiều nhất thành công');
    });

    it('nhận limit tùy chỉnh khi được truyền vào', async () => {
      bookService.getTopReturnedBooks!.mockResolvedValue([]);

      await controller.getTopReturnedBooks(10);

      expect(bookService.getTopReturnedBooks).toHaveBeenCalledWith(10);
    });
  });
});
