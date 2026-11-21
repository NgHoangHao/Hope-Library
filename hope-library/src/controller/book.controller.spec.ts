import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      updateBook: vi.fn(),
      deleteBook: vi.fn(),
      getTopReturnedBooks: vi.fn(),
    };

    controller = new BookController(bookService as unknown as BookService);
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

      const response = await controller.updateBook('book-1', body, mockFile);

      expect(bookService.updateBook).toHaveBeenCalledWith(
        'book-1',
        expect.objectContaining({
          title: 'Updated Title',
          copies: [{ barcode: 'BC001', shelfLocation: 'A1' }],
          image: mockFile,
        }),
        mockFile,
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
        }),
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
      );
    });

    it('ném AppException nếu chuỗi JSON của copies không hợp lệ', async () => {
      const body = {
        copies: '{ invalid json }',
      };

      await expect(controller.updateBook('book-1', body)).rejects.toThrow(AppException);
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
