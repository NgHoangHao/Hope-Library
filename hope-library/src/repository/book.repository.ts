import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Book } from '../model/book/book.entity.js';
import { BookCopy, BookCopyStatus } from '../model/book-copy/book-copy.entity.js';
import { LoanItem, LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import { Loan } from '../model/loan/loan.entity.js';
import { Fine } from '../model/fine/fine.entity.js';
import { AppException } from '../common/index.js';

@Injectable()
export class BookRepository {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(BookCopy)
    private readonly bookCopyRepo: Repository<BookCopy>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Tạo sách mới kèm danh sách các bản sao (BookCopy) trong một Transaction an toàn
   */
  async createWithCopies(
    bookData: Partial<Book>,
    copiesData: Partial<BookCopy>[] = [],
  ): Promise<Book> {
    return await this.dataSource.transaction(async (manager) => {
      const book = manager.create(Book, {
        ...bookData,
        totalCopies: copiesData.length,
        availableCopies: copiesData.length,
      });

      const savedBook = await manager.save(Book, book);

      if (copiesData.length > 0) {
        const copies = copiesData.map((copy) =>
          manager.create(BookCopy, {
            ...copy,
            bookId: savedBook.id,
            status: copy.status ?? BookCopyStatus.AVAILABLE,
          }),
        );
        savedBook.copies = await manager.save(BookCopy, copies);
      } else {
        savedBook.copies = [];
      }

      return savedBook;
    });
  }

  /**
   * Cập nhật sách và danh sách các bản sao (BookCopy) trong một Transaction an toàn
   */
  async updateWithCopies(
    bookId: string,
    bookData: Partial<Book>,
    copiesData?: Partial<BookCopy>[],
  ): Promise<Book> {
    return await this.dataSource.transaction(async (manager) => {
      const bookRepo = manager.getRepository(Book);
      const copyRepo = manager.getRepository(BookCopy);

      const book = await bookRepo.findOne({
        where: { id: bookId },
        relations: { copies: true },
      });

      if (!book) {
        throw AppException.notFound(
          `Không tìm thấy sách với ID: ${bookId}`,
          { id: bookId },
          'BOOK_NOT_FOUND',
        );
      }

      // Cập nhật thông tin cơ bản của sách
      Object.assign(book, bookData);

      // Nếu có cập nhật danh sách bản sao
      if (copiesData !== undefined) {
        const existingCopies = book.copies || [];
        const existingCopyMap = new Map(existingCopies.map((c) => [c.id, c]));
        const existingBarcodeMap = new Map(existingCopies.map((c) => [c.barcode, c]));

        const incomingIds = new Set(copiesData.map((c) => c.id).filter(Boolean));
        const toDeleteCopies = existingCopies.filter((c) => !incomingIds.has(c.id));

        // Kiểm tra xem có bản sao nào đang BORROWED mà bị xóa không
        for (const toDelete of toDeleteCopies) {
          if (toDelete.status === BookCopyStatus.BORROWED) {
            throw AppException.badRequest(
              `Không thể xóa bản sao với barcode '${toDelete.barcode}' vì đang được mượn`,
              { barcode: toDelete.barcode, copyId: toDelete.id },
              'CANNOT_DELETE_BORROWED_COPY',
            );
          }
        }

        if (toDeleteCopies.length > 0) {
          await copyRepo.remove(toDeleteCopies);
        }

        const updatedOrNewCopies: BookCopy[] = [];
        for (const copyDto of copiesData) {
          let copyEntity: BookCopy;
          if (copyDto.id && existingCopyMap.has(copyDto.id)) {
            copyEntity = existingCopyMap.get(copyDto.id)!;
            copyEntity.barcode = copyDto.barcode!;
            if (copyDto.shelfLocation !== undefined) {
              copyEntity.shelfLocation = copyDto.shelfLocation;
            }
            if (copyDto.status) {
              copyEntity.status = copyDto.status;
            }
          } else if (!copyDto.id && copyDto.barcode && existingBarcodeMap.has(copyDto.barcode)) {
            copyEntity = existingBarcodeMap.get(copyDto.barcode)!;
            if (copyDto.shelfLocation !== undefined) {
              copyEntity.shelfLocation = copyDto.shelfLocation;
            }
            if (copyDto.status) {
              copyEntity.status = copyDto.status;
            }
          } else {
            copyEntity = copyRepo.create({
              ...copyDto,
              bookId: book.id,
              status: copyDto.status ?? BookCopyStatus.AVAILABLE,
            });
          }
          updatedOrNewCopies.push(copyEntity);
        }

        const savedCopies = await copyRepo.save(updatedOrNewCopies);
        book.copies = savedCopies;
        book.totalCopies = savedCopies.length;
        book.availableCopies = savedCopies.filter(
          (c) => c.status === BookCopyStatus.AVAILABLE,
        ).length;
      }

      await bookRepo.save(book);

      return await bookRepo.findOneOrFail({
        where: { id: book.id },
        relations: { author: true, category: true, copies: true },
      });
    });
  }

  /**
   * Đồng bộ lại totalCopies và availableCopies từ danh sách relation copies đã load
   */
  private applyCopyCountsFromRelation(book: Book): Book {
    if (Array.isArray(book.copies)) {
      book.totalCopies = book.copies.length;
      book.availableCopies = book.copies.filter(
        (c) => c.status === BookCopyStatus.AVAILABLE,
      ).length;
    }
    return book;
  }

  /**
   * Tính toán chính xác totalCopies và availableCopies trực tiếp từ bảng book_copies
   * để tránh lệch số liệu do cột cache trên bảng books bị sai lệch
   */
  private async applyCopyCountsFromDb(books: Book[]): Promise<Book[]> {
    if (!books || books.length === 0) {
      return books;
    }

    const bookIds = books.map((b) => b.id);
    const rawCounts = await this.bookCopyRepo
      .createQueryBuilder('copy')
      .select('copy.bookId', 'bookId')
      .addSelect('COUNT(copy.id)', 'totalCopies')
      .addSelect(
        'SUM(CASE WHEN copy.status = :availableStatus THEN 1 ELSE 0 END)',
        'availableCopies',
      )
      .where('copy.bookId IN (:...bookIds)', {
        bookIds,
        availableStatus: BookCopyStatus.AVAILABLE,
      })
      .groupBy('copy.bookId')
      .getRawMany<{
        bookId: string;
        totalCopies: string | number;
        availableCopies: string | number;
      }>();

    const countMap = new Map(
      rawCounts.map((row) => [
        String(row.bookId).toLowerCase(),
        {
          totalCopies: Number(row.totalCopies) || 0,
          availableCopies: Number(row.availableCopies) || 0,
        },
      ]),
    );

    for (const book of books) {
      const counts = countMap.get(String(book.id).toLowerCase());
      book.totalCopies = counts ? counts.totalCopies : 0;
      book.availableCopies = counts ? counts.availableCopies : 0;
    }

    return books;
  }

  /**
   * Tìm sách theo ID cùng các quan hệ (tác giả, thể loại, bản sao kèm mục mượn)
   */
  async findById(id: string): Promise<Book | null> {
    const book = await this.bookRepo.findOne({
      where: { id },
      relations: {
        author: true,
        category: true,
        copies: {
          loanItems: true,
        },
      },
    });
    return book ? this.applyCopyCountsFromRelation(book) : null;
  }

  /**
   * Tìm sách theo mã ISBN
   */
  async findByIsbn(isbn: string): Promise<Book | null> {
    return this.bookRepo.findOne({
      where: { isbn },
    });
  }

  /**
   * Tìm kiếm các bản sao theo danh sách mã barcode
   */
  async findCopiesByBarcodes(barcodes: string[]): Promise<BookCopy[]> {
    if (!barcodes || barcodes.length === 0) {
      return [];
    }
    return this.bookCopyRepo.find({
      where: { barcode: In(barcodes) },
    });
  }

  /**
   * Tìm bản sao theo mã barcode đơn lẻ
   */
  async findCopyByBarcode(barcode: string): Promise<BookCopy | null> {
    return this.bookCopyRepo.findOne({
      where: { barcode },
    });
  }

  /**
   * Lấy danh sách sách có phân trang, tìm kiếm và lọc
   */
  async findBooks(options: {
    page: number;
    size: number;
    search?: string;
    categoryId?: string;
    author?: string;
    authorId?: string;
  }): Promise<[Book[], number]> {
    const { page, size, search, categoryId, author, authorId } = options;
    const skip = (page - 1) * size;

    const qb = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .leftJoinAndSelect('book.category', 'category');

    // 1. Tìm kiếm theo tên sách (title)
    if (search && search.trim()) {
      qb.andWhere('book.title LIKE :search', { search: `%${search.trim()}%` });
    }

    // 2. Lọc theo categoryId
    if (categoryId && categoryId.trim()) {
      qb.andWhere('book.categoryId = :categoryId', { categoryId: categoryId.trim() });
    }

    // 3. Lọc theo author (hỗ trợ cả authorId dạng UUID hoặc tên tác giả)
    const targetAuthor = author?.trim() || authorId?.trim();
    if (targetAuthor) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetAuthor);
      if (isUuid) {
        qb.andWhere('(book.authorId = :authorUuid OR author.name LIKE :authorName)', {
          authorUuid: targetAuthor,
          authorName: `%${targetAuthor}%`,
        });
      } else {
        qb.andWhere('author.name LIKE :authorName', {
          authorName: `%${targetAuthor}%`,
        });
      }
    }

    const [books, total] = await qb
      .orderBy('book.createdAt', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();

    await this.applyCopyCountsFromDb(books);
    return [books, total];
  }

  /**
   * Lấy danh sách tất cả sách
   */
  async findAll(): Promise<Book[]> {
    const books = await this.bookRepo.find({
      relations: { author: true, category: true, copies: true },
      order: { createdAt: 'DESC' },
    });
    return books.map((book) => this.applyCopyCountsFromRelation(book));
  }


  /**
   * Lưu hoặc cập nhật thông tin sách
   */
  async save(book: Book): Promise<Book> {
    return this.bookRepo.save(book);
  }

  /**
   * Xóa sách và toàn bộ các đối tượng liên quan (bản sao sách, mục mượn, phiếu mượn rỗng, tiền phạt liên quan)
   * trong một Transaction an toàn. Nếu có bất kỳ bản sao nào đang được mượn thì ném ngoại lệ.
   */
  async deleteBookWithRelations(bookId: string): Promise<boolean> {
    return await this.dataSource.transaction(async (manager) => {
      const bookRepo = manager.getRepository(Book);
      const copyRepo = manager.getRepository(BookCopy);
      const loanItemRepo = manager.getRepository(LoanItem);
      const loanRepo = manager.getRepository(Loan);
      const fineRepo = manager.getRepository(Fine);

      const book = await bookRepo.findOne({
        where: { id: bookId },
        relations: {
          copies: {
            loanItems: true,
          },
        },
      });

      if (!book) {
        throw AppException.notFound(
          `Không tìm thấy sách với ID: ${bookId}`,
          { id: bookId },
          'BOOK_NOT_FOUND',
        );
      }

      const copies = book.copies || [];

      // Kiểm tra xem có bản sao nào đang được mượn hay không
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
            bookId,
            borrowedBarcodes: borrowedCopies.map((c) => c.barcode),
            borrowedCopiesCount: borrowedCopies.length,
          },
          'CANNOT_DELETE_BORROWED_BOOK',
        );
      }

      // Xử lý và xóa các đối tượng liên quan nếu sách có bản sao
      if (copies.length > 0) {
        const copyIds = copies.map((c) => c.id);

        const relatedLoanItems = await loanItemRepo.find({
          where: { bookCopyId: In(copyIds) },
        });

        if (relatedLoanItems.length > 0) {
          const affectedLoanIds = [...new Set(relatedLoanItems.map((item) => item.loanId))];

          // Xóa toàn bộ các loanItems của các bản sao này
          await loanItemRepo.delete({ bookCopyId: In(copyIds) });

          // Kiểm tra và dọn dẹp các phiếu mượn (Loan) nếu không còn loanItem nào
          for (const loanId of affectedLoanIds) {
            const remainingCount = await loanItemRepo.count({
              where: { loanId },
            });
            if (remainingCount === 0) {
              await fineRepo.delete({ loanId });
              await loanRepo.delete({ id: loanId });
            }
          }
        }

        // Xóa toàn bộ bản sao của sách
        await copyRepo.delete({ bookId });
      }

      // Xóa sách
      const deleteResult = await bookRepo.delete({ id: bookId });
      return (deleteResult.affected ?? 0) > 0;
    });
  }

  /**
   * Xóa sách theo ID (xóa an toàn kèm các đối tượng liên quan)
   */
  async delete(id: string): Promise<boolean> {
    return this.deleteBookWithRelations(id);
  }

  /**
   * Lấy top các sách có số lượng loanItem trạng thái RETURNED nhiều nhất
   */
  async findTopReturnedBooks(limit: number = 4): Promise<Book[]> {
    const rawResults = await this.bookRepo
      .createQueryBuilder('book')
      .innerJoin('book.copies', 'copy')
      .innerJoin('copy.loanItems', 'loanItem')
      .where('loanItem.status = :status', { status: LoanItemStatus.RETURNED })
      .select('book.id', 'bookId')
      .addSelect('COUNT(loanItem.id)', 'returnedCount')
      .groupBy('book.id')
      .orderBy('COUNT(loanItem.id)', 'DESC')
      .limit(limit)
      .getRawMany<{ bookId: string; returnedCount: string | number }>();

    if (!rawResults || rawResults.length === 0) {
      return [];
    }

    const bookIds = rawResults.map((r) => r.bookId);

    const books = await this.bookRepo.find({
      where: { id: In(bookIds) },
      relations: { author: true, category: true, copies: true },
    });

    const bookMap = new Map(
      books.map((b) => [b.id, this.applyCopyCountsFromRelation(b)]),
    );
    return bookIds
      .map((id) => bookMap.get(id))
      .filter((b): b is Book => b !== undefined);
  }
}
