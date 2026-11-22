import { Injectable, Logger } from '@nestjs/common';
import { BookRepository } from '../repository/book.repository.js';
import {
  FileStorageService,
  SaveImageResult,
  SavePdfResult,
} from '../utils/file-storage.service.js';
import { Book, BookStatus } from '../model/book/book.entity.js';
import { BookCopy, BookCopyStatus } from '../model/book-copy/book-copy.entity.js';
import { LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import {
  CreateBookDto,
  UpdateBookDto,
  BookResponse,
  BookDetailResponse,
  QueryBookDto,
  PaginatedBookResponse,
} from '../model/book/book.dto.js';
import { AppException } from '../common/index.js';
import { BookMapper } from '../mapper/book.mapper.js';

@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);

  constructor(
    private readonly bookRepo: BookRepository,
    private readonly fileStorageService: FileStorageService,
    private readonly bookMapper: BookMapper,
  ) {}

  /**
   * Thêm mới sách, chuyển đổi ảnh bìa & file PDF thành URL và lưu trữ bản sao
   */
  async createBook(
    dto: CreateBookDto,
    imageFile?: Express.Multer.File,
    pdfFile?: Express.Multer.File,
  ): Promise<BookDetailResponse> {
    // 1. Validate tiêu đề sách
    if (!dto.title || !dto.title.trim()) {
      throw AppException.badRequest(
        'Tiêu đề sách không được để trống',
        { field: 'title' },
        'BOOK_TITLE_REQUIRED',
      );
    }

    const trimmedTitle = dto.title.trim();
    const trimmedIsbn = dto.isbn?.trim() || null;

    // 2. Validate ISBN nếu có
    if (trimmedIsbn) {
      const existingByIsbn = await this.bookRepo.findByIsbn(trimmedIsbn);
      if (existingByIsbn) {
        throw AppException.conflict(
          `Sách với mã ISBN '${trimmedIsbn}' đã tồn tại trong hệ thống`,
          { isbn: trimmedIsbn },
          'BOOK_ISBN_CONFLICT',
        );
      }
    }

    // 3. Validate năm xuất bản nếu có
    let parsedYear: number | null = null;
    if (dto.publicationYear !== undefined && dto.publicationYear !== null) {
      parsedYear = Number(dto.publicationYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(parsedYear) || parsedYear < 1000 || parsedYear > currentYear + 1) {
        throw AppException.badRequest(
          'Năm xuất bản không hợp lệ',
          { publicationYear: dto.publicationYear },
          'INVALID_PUBLICATION_YEAR',
        );
      }
    }

    // 4. Validate danh sách bản sao (BookCopy)
    const copiesData: Partial<BookCopy>[] = [];
    if (dto.copies && dto.copies.length > 0) {
      const barcodes: string[] = [];

      for (let i = 0; i < dto.copies.length; i++) {
        const copy = dto.copies[i];
        if (!copy.barcode || !copy.barcode.trim()) {
          throw AppException.badRequest(
            `Bản sao thứ ${i + 1} thiếu mã barcode`,
            { index: i, copy },
            'BARCODE_REQUIRED',
          );
        }
        barcodes.push(copy.barcode.trim());
      }

      // Kiểm tra trùng lặp barcode ngay trong danh sách gửi lên
      const duplicateBarcodes = barcodes.filter(
        (item, index) => barcodes.indexOf(item) !== index,
      );
      if (duplicateBarcodes.length > 0) {
        throw AppException.badRequest(
          'Danh sách bản sao chứa mã barcode trùng lặp',
          { duplicates: [...new Set(duplicateBarcodes)] },
          'DUPLICATE_BARCODE_IN_REQUEST',
        );
      }

      // Kiểm tra barcode đã tồn tại trong database
      const existingCopies = await this.bookRepo.findCopiesByBarcodes(barcodes);
      if (existingCopies.length > 0) {
        const conflictBarcodes = existingCopies.map((c) => c.barcode);
        throw AppException.conflict(
          'Một hoặc nhiều mã barcode đã tồn tại trong cơ sở dữ liệu',
          { existingBarcodes: conflictBarcodes },
          'BARCODE_ALREADY_EXISTS',
        );
      }

      for (const copy of dto.copies) {
        copiesData.push({
          barcode: copy.barcode.trim(),
          shelfLocation: copy.shelfLocation?.trim() || null,
          status: BookCopyStatus.AVAILABLE,
        });
      }
    }

    // 5. Xử lý file ảnh bìa (png, jpg/jpeg, webp) và file PDF nội dung sách
    const fileToUpload = imageFile || dto.image;
    const pdfToUpload = pdfFile || dto.pdf;
    let uploadResult: SaveImageResult | null = null;
    let pdfUploadResult: SavePdfResult | null = null;

    if (fileToUpload) {
      // Sẽ ném ngoại lệ nếu file không đúng định dạng ảnh hợp lệ
      uploadResult = await this.fileStorageService.saveImage(fileToUpload, 'books');
    }

    if (pdfToUpload) {
      try {
        pdfUploadResult = await this.fileStorageService.savePdf(pdfToUpload, 'books/pdfs');
      } catch (error) {
        if (uploadResult?.filePath) {
          await this.fileStorageService.deleteFile(uploadResult.filePath).catch((err) => {
            this.logger.error(`Không thể xóa file ảnh sau khi upload PDF thất bại: ${err.message}`);
          });
        }
        throw error;
      }
    }

    // 6. Lưu vào cơ sở dữ liệu (Transaction)
    try {
      const bookData: Partial<Book> = {
        title: trimmedTitle,
        isbn: trimmedIsbn,
        authorId: dto.authorId || null,
        categoryId: dto.categoryId || null,
        publisher: dto.publisher?.trim() || null,
        publicationYear: parsedYear,
        edition: dto.edition?.trim() || null,
        description: dto.description?.trim() || null,
        bookUrl: uploadResult?.fileUrl || null,
        pdfUrl: pdfUploadResult?.fileUrl || null,
        status: BookStatus.ACTIVE,
      };

      const savedBook = await this.bookRepo.createWithCopies(bookData, copiesData);
      return this.bookMapper.toDetailResponse(savedBook);
    } catch (error) {
      // Nếu có lỗi khi lưu DB, rollback xóa file ảnh và file PDF vừa tải lên để tránh file rác
      if (uploadResult?.filePath) {
        await this.fileStorageService.deleteFile(uploadResult.filePath).catch((err) => {
          this.logger.error(`Không thể xóa file ảnh sau rollback: ${err.message}`);
        });
      }
      if (pdfUploadResult?.filePath) {
        await this.fileStorageService.deleteFile(pdfUploadResult.filePath, 'raw').catch((err) => {
          this.logger.error(`Không thể xóa file PDF sau rollback: ${err.message}`);
        });
      }

      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error(`Lỗi khi tạo sách: ${(error as Error).message}`);
      throw AppException.internal(
        'Đã có lỗi hệ thống xảy ra khi lưu sách vào cơ sở dữ liệu',
        { error: (error as Error).message },
        'CREATE_BOOK_FAILED',
      );
    }
  }

  /**
   * Cập nhật sách cùng danh sách bản sao (BookCopy), nếu không truyền ảnh/PDF mới hoặc null thì giữ nguyên file cũ
   */
  async updateBook(
    id: string,
    dto: UpdateBookDto,
    imageFile?: Express.Multer.File,
    pdfFile?: Express.Multer.File,
  ): Promise<BookDetailResponse> {
    // 1. Kiểm tra sách tồn tại
    const existingBook = await this.bookRepo.findById(id);
    if (!existingBook) {
      throw AppException.notFound(
        `Không tìm thấy sách với ID: ${id}`,
        { id },
        'BOOK_NOT_FOUND',
      );
    }

    // 2. Validate tiêu đề sách (nếu có cập nhật)
    let trimmedTitle: string | undefined = undefined;
    if (dto.title !== undefined) {
      if (!dto.title || !dto.title.trim()) {
        throw AppException.badRequest(
          'Tiêu đề sách không được để trống',
          { field: 'title' },
          'BOOK_TITLE_REQUIRED',
        );
      }
      trimmedTitle = dto.title.trim();
    }

    // 3. Validate ISBN (nếu có cập nhật)
    let trimmedIsbn: string | null | undefined = undefined;
    if (dto.isbn !== undefined) {
      trimmedIsbn = dto.isbn?.trim() || null;
      if (trimmedIsbn && trimmedIsbn !== existingBook.isbn) {
        const existingByIsbn = await this.bookRepo.findByIsbn(trimmedIsbn);
        if (existingByIsbn && existingByIsbn.id !== id) {
          throw AppException.conflict(
            `Sách với mã ISBN '${trimmedIsbn}' đã tồn tại trong hệ thống`,
            { isbn: trimmedIsbn },
            'BOOK_ISBN_CONFLICT',
          );
        }
      }
    }

    // 4. Validate năm xuất bản (nếu có cập nhật)
    let parsedYear: number | null | undefined = undefined;
    if (dto.publicationYear !== undefined) {
      if (dto.publicationYear === null || (dto.publicationYear as unknown) === '') {
        parsedYear = null;
      } else {
        parsedYear = Number(dto.publicationYear);
        const currentYear = new Date().getFullYear();
        if (isNaN(parsedYear) || parsedYear < 1000 || parsedYear > currentYear + 1) {
          throw AppException.badRequest(
            'Năm xuất bản không hợp lệ',
            { publicationYear: dto.publicationYear },
            'INVALID_PUBLICATION_YEAR',
          );
        }
      }
    }

    // 5. Validate danh sách bản sao (BookCopy) nếu có truyền
    const rawCopies = dto.copies;
    let copiesData: Partial<BookCopy>[] | undefined = undefined;

    if (rawCopies !== undefined) {
      copiesData = [];
      const barcodes: string[] = [];

      for (let i = 0; i < rawCopies.length; i++) {
        const copy = rawCopies[i];
        if (!copy.barcode || !copy.barcode.trim()) {
          throw AppException.badRequest(
            `Bản sao thứ ${i + 1} thiếu mã barcode`,
            { index: i, copy },
            'BARCODE_REQUIRED',
          );
        }
        barcodes.push(copy.barcode.trim());
      }

      // Kiểm tra trùng lặp barcode ngay trong danh sách gửi lên
      const duplicateBarcodes = barcodes.filter(
        (item, index) => barcodes.indexOf(item) !== index,
      );
      if (duplicateBarcodes.length > 0) {
        throw AppException.badRequest(
          'Danh sách bản sao chứa mã barcode trùng lặp',
          { duplicates: [...new Set(duplicateBarcodes)] },
          'DUPLICATE_BARCODE_IN_REQUEST',
        );
      }

      // Kiểm tra barcode đã tồn tại trong database (thuộc sách khác)
      if (barcodes.length > 0) {
        const existingCopies = await this.bookRepo.findCopiesByBarcodes(barcodes);
        const conflictCopies = existingCopies.filter((c) => c.bookId !== id);
        if (conflictCopies.length > 0) {
          const conflictBarcodes = conflictCopies.map((c) => c.barcode);
          throw AppException.conflict(
            'Một hoặc nhiều mã barcode đã thuộc về cuốn sách khác trong cơ sở dữ liệu',
            { existingBarcodes: conflictBarcodes },
            'BARCODE_ALREADY_EXISTS',
          );
        }
      }

      for (const copy of rawCopies) {
        copiesData.push({
          id: copy.id || undefined,
          barcode: copy.barcode.trim(),
          shelfLocation: copy.shelfLocation?.trim() || null,
          status: copy.status ?? BookCopyStatus.AVAILABLE,
        });
      }
    }

    // 6. Xử lý file ảnh bìa và file PDF: nếu null/undefined thì giữ nguyên file cũ
    const fileToUpload = imageFile ?? dto.image;
    const pdfToUpload = pdfFile ?? dto.pdf;
    let uploadResult: SaveImageResult | null = null;
    let pdfUploadResult: SavePdfResult | null = null;

    if (fileToUpload) {
      uploadResult = await this.fileStorageService.saveImage(fileToUpload, 'books');
    }

    if (pdfToUpload) {
      try {
        pdfUploadResult = await this.fileStorageService.savePdf(pdfToUpload, 'books/pdfs');
      } catch (error) {
        if (uploadResult?.filePath) {
          await this.fileStorageService.deleteFile(uploadResult.filePath).catch((err) => {
            this.logger.error(`Không thể xóa file ảnh sau khi upload PDF thất bại: ${err.message}`);
          });
        }
        throw error;
      }
    }

    // 7. Cập nhật vào cơ sở dữ liệu (Transaction)
    try {
      const bookData: Partial<Book> = {};

      if (trimmedTitle !== undefined) {
        bookData.title = trimmedTitle;
      }
      if (trimmedIsbn !== undefined) {
        bookData.isbn = trimmedIsbn;
      }
      if (dto.authorId !== undefined) {
        bookData.authorId = dto.authorId || null;
      }
      if (dto.categoryId !== undefined) {
        bookData.categoryId = dto.categoryId || null;
      }
      if (dto.publisher !== undefined) {
        bookData.publisher = dto.publisher?.trim() || null;
      }
      if (parsedYear !== undefined) {
        bookData.publicationYear = parsedYear;
      }
      if (dto.edition !== undefined) {
        bookData.edition = dto.edition?.trim() || null;
      }
      if (dto.description !== undefined) {
        bookData.description = dto.description?.trim() || null;
      }
      if (dto.status !== undefined) {
        bookData.status = dto.status;
      }
      // Nếu có upload file ảnh mới thì mới cập nhật bookUrl; nếu null/undefined thì không thay đổi
      if (uploadResult?.fileUrl) {
        bookData.bookUrl = uploadResult.fileUrl;
      }
      // Nếu có upload file PDF mới thì mới cập nhật pdfUrl; nếu null/undefined thì không thay đổi
      if (pdfUploadResult?.fileUrl) {
        bookData.pdfUrl = pdfUploadResult.fileUrl;
      }

      const updatedBook = await this.bookRepo.updateWithCopies(id, bookData, copiesData);

      // Nếu có ảnh mới và sách cũ đã có ảnh khác, xóa ảnh cũ
      if (
        uploadResult?.fileUrl &&
        existingBook.bookUrl &&
        existingBook.bookUrl !== uploadResult.fileUrl
      ) {
        try {
          await this.fileStorageService.deleteFile(existingBook.bookUrl);
        } catch (err: any) {
          this.logger.warn(`Không thể xóa file ảnh cũ sau khi cập nhật: ${err?.message}`);
        }
      }

      // Nếu có file PDF mới và sách cũ đã có PDF khác, xóa PDF cũ
      if (
        pdfUploadResult?.fileUrl &&
        existingBook.pdfUrl &&
        existingBook.pdfUrl !== pdfUploadResult.fileUrl
      ) {
        try {
          await this.fileStorageService.deleteFile(existingBook.pdfUrl, 'raw');
        } catch (err: any) {
          this.logger.warn(`Không thể xóa file PDF cũ sau khi cập nhật: ${err?.message}`);
        }
      }

      return this.bookMapper.toDetailResponse(updatedBook);
    } catch (error) {
      // Nếu có lỗi khi lưu DB, rollback xóa file ảnh/PDF vừa tải lên để tránh file rác
      if (uploadResult?.filePath) {
        try {
          await this.fileStorageService.deleteFile(uploadResult.filePath);
        } catch (err: any) {
          this.logger.error(`Không thể xóa file ảnh sau rollback: ${err?.message}`);
        }
      }
      if (pdfUploadResult?.filePath) {
        try {
          await this.fileStorageService.deleteFile(pdfUploadResult.filePath, 'raw');
        } catch (err: any) {
          this.logger.error(`Không thể xóa file PDF sau rollback: ${err?.message}`);
        }
      }

      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error(`Lỗi khi cập nhật sách: ${(error as Error).message}`);
      throw AppException.internal(
        'Đã có lỗi hệ thống xảy ra khi cập nhật sách vào cơ sở dữ liệu',
        { error: (error as Error).message },
        'UPDATE_BOOK_FAILED',
      );
    }
  }

  /**
   * Lấy chi tiết sách theo ID
   */
  async getBookById(id: string): Promise<BookDetailResponse> {
    const book = await this.bookRepo.findById(id);
    if (!book) {
      throw AppException.notFound(
        `Không tìm thấy sách với ID: ${id}`,
        { id },
        'BOOK_NOT_FOUND',
      );
    }
    return this.bookMapper.toDetailResponse(book);
  }

  /**
   * Lấy nội dung file PDF của sách theo ID để người dùng xem trực tiếp
   */
  async getBookPdf(id: string): Promise<{ buffer: Buffer; fileName: string; pdfUrl: string }> {
    const book = await this.bookRepo.findById(id);
    if (!book) {
      throw AppException.notFound(
        `Không tìm thấy sách với ID: ${id}`,
        { id },
        'BOOK_NOT_FOUND',
      );
    }

    if (!book.pdfUrl) {
      throw AppException.notFound(
        'Sách này chưa có file PDF nội dung',
        { id },
        'BOOK_PDF_NOT_FOUND',
      );
    }

    try {
      const response = await fetch(book.pdfUrl);
      if (!response.ok) {
        throw AppException.internal(
          'Không thể tải file PDF nội dung sách từ hệ thống lưu trữ',
          { id, status: response.status },
          'BOOK_PDF_FETCH_FAILED',
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const safeTitle = (book.title || 'book')
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .trim() || 'book';

      return {
        buffer: Buffer.from(arrayBuffer),
        fileName: `${safeTitle}.pdf`,
        pdfUrl: book.pdfUrl,
      };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error(`Lỗi khi tải file PDF của sách ${id}: ${(error as Error).message}`);
      throw AppException.internal(
        'Không thể tải file PDF nội dung sách từ hệ thống lưu trữ',
        { id, error: (error as Error).message },
        'BOOK_PDF_FETCH_FAILED',
      );
    }
  }

  /**
   * Lấy danh sách sách có phân trang, tìm kiếm và lọc
   */
  async getAllBooks(query?: QueryBookDto): Promise<PaginatedBookResponse> {
    const pageNumber = Math.max(1, Number(query?.page) || 1);
    const pageSize = Math.max(1, Number(query?.size) || 10);

    const [books, total] = await this.bookRepo.findBooks({
      page: pageNumber,
      size: pageSize,
      search: query?.search,
      categoryId: query?.categoryId,
      author: query?.author,
      authorId: query?.authorId,
    });

    return this.bookMapper.toPaginatedResponse(books, total, pageNumber, pageSize);
  }

  /**
   * Xóa sách và toàn bộ các đối tượng liên quan (bản sao sách, mục mượn, file ảnh)
   * Nếu có bất kỳ bản sao nào đang được mượn thì ném ngoại lệ không cho phép xóa.
   */
  async deleteBook(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw AppException.badRequest(
        'Mã định danh sách (id) không hợp lệ',
        { id },
        'INVALID_BOOK_ID',
      );
    }

    const cleanId = id.trim();
    const book = await this.bookRepo.findById(cleanId);
    if (!book) {
      throw AppException.notFound(
        `Không tìm thấy sách với ID: ${cleanId}`,
        { id: cleanId },
        'BOOK_NOT_FOUND',
      );
    }

    // 1. Kiểm tra xem sách có bất kỳ bản sao nào đang được mượn không
    const copies = book.copies || [];
    const borrowedCopies = copies.filter((copy) => {
      const isCopyBorrowed =
        copy.status === BookCopyStatus.BORROWED || copy.status === BookCopyStatus.RESERVED;
      const hasBorrowedLoanItem = copy.loanItems?.some(
        (item) => item.status === LoanItemStatus.BORROWED,
      );
      return isCopyBorrowed || hasBorrowedLoanItem;
    });

    if (borrowedCopies.length > 0) {
      throw AppException.badRequest(
        `Không thể xóa sách vì có ${borrowedCopies.length} bản sao đang được mượn`,
        {
          bookId: cleanId,
          borrowedBarcodes: borrowedCopies.map((c) => c.barcode),
          borrowedCopiesCount: borrowedCopies.length,
        },
        'CANNOT_DELETE_BORROWED_BOOK',
      );
    }

    // 2. Thực hiện xóa sách cùng toàn bộ đối tượng liên quan trong CSDL
    const isDeleted = await this.bookRepo.deleteBookWithRelations(cleanId);
    if (!isDeleted) {
      throw AppException.badRequest(
        `Xóa sách thất bại với ID: ${cleanId}`,
        { id: cleanId },
        'DELETE_BOOK_FAILED',
      );
    }

    // 3. Xóa file ảnh bìa và file PDF trên lưu trữ nếu có sau khi đã xóa thành công trong CSDL
    if (book.bookUrl) {
      await this.fileStorageService.deleteFile(book.bookUrl).catch((err) => {
        this.logger.warn(`Không thể xóa file ảnh của sách: ${err.message}`);
      });
    }
    if (book.pdfUrl) {
      await this.fileStorageService.deleteFile(book.pdfUrl, 'raw').catch((err) => {
        this.logger.warn(`Không thể xóa file PDF của sách: ${err.message}`);
      });
    }
  }

  /**
   * Lấy top sách có số lượng loanItem trạng thái RETURNED nhiều nhất
   */
  async getTopReturnedBooks(limit: number = 4): Promise<BookResponse[]> {
    const parsedLimit = Number(limit);
    const safeLimit = !parsedLimit || parsedLimit <= 0 ? 4 : parsedLimit;
    const books = await this.bookRepo.findTopReturnedBooks(safeLimit);
    return this.bookMapper.toResponseList(books);
  }
}
