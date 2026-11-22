import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { ClientSession, Connection, Model } from 'mongoose';
import { Book } from '../model/book/book.entity.js';
import { BookCopy, BookCopyStatus } from '../model/book-copy/book-copy.entity.js';
import { Author } from '../model/author/author.entity.js';
import { Category } from '../model/category/category.entity.js';
import { LoanItem, LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import { Loan } from '../model/loan/loan.entity.js';
import { Fine } from '../model/fine/fine.entity.js';
import { AppException } from '../common/index.js';
import {
  buildContainsRegex,
  prepareDocumentForSave,
  toEntities,
  toEntity,
} from '../database/mongo.helper.js';

@Injectable()
export class BookRepository {
  constructor(
    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,
    @InjectModel(BookCopy.name)
    private readonly bookCopyModel: Model<BookCopy>,
    @InjectModel(Author.name)
    private readonly authorModel: Model<Author>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectModel(LoanItem.name)
    private readonly loanItemModel: Model<LoanItem>,
    @InjectModel(Loan.name)
    private readonly loanModel: Model<Loan>,
    @InjectModel(Fine.name)
    private readonly fineModel: Model<Fine>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  private async attachAuthorAndCategory(
    books: Book[],
    session?: ClientSession,
  ): Promise<Book[]> {
    if (books.length === 0) return books;

    const authorIds = [
      ...new Set(books.map((b) => b.authorId).filter((id): id is string => Boolean(id))),
    ];
    const categoryIds = [
      ...new Set(books.map((b) => b.categoryId).filter((id): id is string => Boolean(id))),
    ];

    const authorQuery = authorIds.length
      ? this.authorModel.find({ id: { $in: authorIds } }).lean()
      : null;
    const categoryQuery = categoryIds.length
      ? this.categoryModel.find({ id: { $in: categoryIds } }).lean()
      : null;

    if (session) {
      authorQuery?.session(session);
      categoryQuery?.session(session);
    }

    const [authorDocs, categoryDocs] = await Promise.all([
      authorQuery ? authorQuery.exec() : Promise.resolve([]),
      categoryQuery ? categoryQuery.exec() : Promise.resolve([]),
    ]);

    const authorMap = new Map(toEntities(Author, authorDocs).map((a) => [a.id, a]));
    const categoryMap = new Map(toEntities(Category, categoryDocs).map((c) => [c.id, c]));

    for (const book of books) {
      book.author = book.authorId ? (authorMap.get(book.authorId) ?? null) : null;
      book.category = book.categoryId ? (categoryMap.get(book.categoryId) ?? null) : null;
    }

    return books;
  }

  private async attachCopies(
    books: Book[],
    includeLoanItems: boolean = false,
    session?: ClientSession,
  ): Promise<Book[]> {
    if (books.length === 0) return books;

    const bookIds = books.map((b) => b.id);
    const copyQuery = this.bookCopyModel.find({ bookId: { $in: bookIds } }).lean();
    if (session) copyQuery.session(session);
    const copyDocs = await copyQuery.exec();
    const copies = toEntities(BookCopy, copyDocs);

    if (includeLoanItems && copies.length > 0) {
      const copyIds = copies.map((c) => c.id);
      const liQuery = this.loanItemModel.find({ bookCopyId: { $in: copyIds } }).lean();
      if (session) liQuery.session(session);
      const liDocs = await liQuery.exec();
      const loanItems = toEntities(LoanItem, liDocs);

      const liByCopy = new Map<string, LoanItem[]>();
      for (const li of loanItems) {
        const list = liByCopy.get(li.bookCopyId) ?? [];
        list.push(li);
        liByCopy.set(li.bookCopyId, list);
      }
      for (const copy of copies) {
        copy.loanItems = liByCopy.get(copy.id) ?? [];
      }
    }

    const copiesByBook = new Map<string, BookCopy[]>();
    for (const copy of copies) {
      const list = copiesByBook.get(copy.bookId) ?? [];
      list.push(copy);
      copiesByBook.set(copy.bookId, list);
    }

    for (const book of books) {
      book.copies = copiesByBook.get(book.id) ?? [];
    }

    return books;
  }

  /**
   * Tạo sách mới kèm danh sách các bản sao (BookCopy) trong một Transaction an toàn
   */
  async createWithCopies(
    bookData: Partial<Book>,
    copiesData: Partial<BookCopy>[] = [],
  ): Promise<Book> {
    const session = await this.connection.startSession();
    try {
      let savedBook!: Book;
      await session.withTransaction(async () => {
        const book = new Book({
          ...bookData,
          totalCopies: copiesData.length,
          availableCopies: copiesData.length,
        });
        const bookPayload = prepareDocumentForSave(book);
        const [createdBookDoc] = await this.bookModel.create([bookPayload], { session });
        savedBook = toEntity(Book, createdBookDoc) ?? book;

        if (copiesData.length > 0) {
          const copyPayloads = copiesData.map((copy) =>
            prepareDocumentForSave(
              new BookCopy({
                ...copy,
                bookId: savedBook.id,
                status: copy.status ?? BookCopyStatus.AVAILABLE,
              }),
            ),
          );
          const createdCopies = await this.bookCopyModel.create(copyPayloads, {
            session,
            ordered: true,
          });
          savedBook.copies = toEntities(BookCopy, createdCopies);
        } else {
          savedBook.copies = [];
        }
      });
      return savedBook;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Cập nhật sách và danh sách các bản sao (BookCopy) trong một Transaction an toàn
   */
  async updateWithCopies(
    bookId: string,
    bookData: Partial<Book>,
    copiesData?: Partial<BookCopy>[],
  ): Promise<Book> {
    const session = await this.connection.startSession();
    try {
      let resultBook!: Book;
      await session.withTransaction(async () => {
        const bookDoc = await this.bookModel
          .findOne({ id: bookId })
          .session(session)
          .lean()
          .exec();
        const book = toEntity(Book, bookDoc);

        if (!book) {
          throw AppException.notFound(
            `Không tìm thấy sách với ID: ${bookId}`,
            { id: bookId },
            'BOOK_NOT_FOUND',
          );
        }

        await this.attachCopies([book], false, session);
        Object.assign(book, bookData);

        if (copiesData !== undefined) {
          const existingCopies = book.copies || [];
          const existingCopyMap = new Map(existingCopies.map((c) => [c.id, c]));
          const existingBarcodeMap = new Map(existingCopies.map((c) => [c.barcode, c]));

          // Ánh xạ từng bản sao đầu vào với bản sao hiện có (ưu tiên theo id, fallback theo barcode)
          const matchedEntries = copiesData.map((copyDto) => {
            let matchedCopy: BookCopy | undefined;
            if (copyDto.id && existingCopyMap.has(copyDto.id)) {
              matchedCopy = existingCopyMap.get(copyDto.id);
            } else if (!copyDto.id && copyDto.barcode && existingBarcodeMap.has(copyDto.barcode)) {
              matchedCopy = existingBarcodeMap.get(copyDto.barcode);
            }
            return { copyDto, matchedCopy };
          });

          const matchedExistingIds = new Set(
            matchedEntries
              .map((entry) => entry.matchedCopy?.id)
              .filter((copyId): copyId is string => Boolean(copyId)),
          );
          const toDeleteCopies = existingCopies.filter((c) => !matchedExistingIds.has(c.id));

          for (const toDelete of toDeleteCopies) {
            if (
              toDelete.status === BookCopyStatus.BORROWED ||
              toDelete.status === BookCopyStatus.RESERVED
            ) {
              throw AppException.badRequest(
                `Không thể xóa bản sao với barcode '${toDelete.barcode}' vì đang được mượn`,
                { barcode: toDelete.barcode, copyId: toDelete.id },
                'CANNOT_DELETE_BORROWED_COPY',
              );
            }
          }

          if (toDeleteCopies.length > 0) {
            await this.bookCopyModel
              .deleteMany({ id: { $in: toDeleteCopies.map((c) => c.id) } })
              .session(session)
              .exec();
          }

          // Tránh xung đột unique index trên barcode khi hoán đổi barcode giữa các bản sao của cùng một sách
          const copiesChangingBarcode = matchedEntries.filter(
            ({ copyDto, matchedCopy }) =>
              matchedCopy && copyDto.barcode && copyDto.barcode !== matchedCopy.barcode,
          );
          if (copiesChangingBarcode.length > 0) {
            const incomingBarcodes = new Set(
              copiesChangingBarcode
                .map(({ copyDto }) => copyDto.barcode)
                .filter((b): b is string => Boolean(b)),
            );
            const conflictingOldCopies = copiesChangingBarcode.filter(
              ({ matchedCopy }) => matchedCopy && incomingBarcodes.has(matchedCopy.barcode),
            );
            for (const { matchedCopy } of conflictingOldCopies) {
              if (!matchedCopy) continue;
              await this.bookCopyModel
                .updateOne(
                  { id: matchedCopy.id },
                  { $set: { barcode: `__tmp_swap_${matchedCopy.id}` } },
                )
                .session(session)
                .exec();
            }
          }

          const savedCopies: BookCopy[] = [];
          for (const { copyDto, matchedCopy } of matchedEntries) {
            let copyEntity: BookCopy;
            if (matchedCopy) {
              copyEntity = matchedCopy;
              if (copyDto.barcode !== undefined) {
                copyEntity.barcode = copyDto.barcode;
              }
              if (copyDto.shelfLocation !== undefined) {
                copyEntity.shelfLocation = copyDto.shelfLocation;
              }
              if (copyDto.status !== undefined) {
                copyEntity.status = copyDto.status;
              }
            } else {
              copyEntity = new BookCopy({
                ...copyDto,
                bookId: book.id,
                shelfLocation: copyDto.shelfLocation ?? null,
                status: copyDto.status ?? BookCopyStatus.AVAILABLE,
              });
            }

            const copyPayload = prepareDocumentForSave(copyEntity);
            const savedCopyDoc = await this.bookCopyModel
              .findOneAndUpdate(
                { id: copyPayload.id },
                { $set: copyPayload },
                { upsert: true, returnDocument: 'after', session },
              )
              .lean()
              .exec();
            savedCopies.push(toEntity(BookCopy, savedCopyDoc) ?? copyEntity);
          }

          book.copies = savedCopies;
          book.totalCopies = savedCopies.length;
          book.availableCopies = savedCopies.filter(
            (c) => c.status === BookCopyStatus.AVAILABLE,
          ).length;
        }

        const bookPayload = prepareDocumentForSave(book);
        const updatedDoc = await this.bookModel
          .findOneAndUpdate(
            { id: book.id },
            { $set: bookPayload },
            { returnDocument: 'after', session },
          )
          .lean()
          .exec();

        resultBook = toEntity(Book, updatedDoc) ?? book;
        await Promise.all([
          this.attachAuthorAndCategory([resultBook], session),
          this.attachCopies([resultBook], false, session),
        ]);
      });

      return resultBook;
    } finally {
      await session.endSession();
    }
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
   * Tính toán chính xác totalCopies và availableCopies trực tiếp từ collection book_copies
   */
  private async applyCopyCountsFromDb(books: Book[]): Promise<Book[]> {
    if (!books || books.length === 0) {
      return books;
    }

    const bookIds = books.map((b) => b.id);
    const rawCounts = await this.bookCopyModel
      .aggregate<{
        _id: string;
        totalCopies: number;
        availableCopies: number;
      }>([
        { $match: { bookId: { $in: bookIds } } },
        {
          $group: {
            _id: '$bookId',
            totalCopies: { $sum: 1 },
            availableCopies: {
              $sum: {
                $cond: [{ $eq: ['$status', BookCopyStatus.AVAILABLE] }, 1, 0],
              },
            },
          },
        },
      ])
      .exec();

    const countMap = new Map(
      rawCounts.map((row) => [
        String(row._id).toLowerCase(),
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
    const doc = await this.bookModel.findOne({ id }).lean().exec();
    const book = toEntity(Book, doc);
    if (!book) return null;

    await Promise.all([
      this.attachAuthorAndCategory([book]),
      this.attachCopies([book], true),
    ]);

    return this.applyCopyCountsFromRelation(book);
  }

  /**
   * Tìm sách theo mã ISBN
   */
  async findByIsbn(isbn: string): Promise<Book | null> {
    const doc = await this.bookModel.findOne({ isbn }).lean().exec();
    return toEntity(Book, doc);
  }

  /**
   * Tìm kiếm các bản sao theo danh sách mã barcode
   */
  async findCopiesByBarcodes(barcodes: string[]): Promise<BookCopy[]> {
    if (!barcodes || barcodes.length === 0) {
      return [];
    }
    const docs = await this.bookCopyModel
      .find({ barcode: { $in: barcodes } })
      .lean()
      .exec();
    return toEntities(BookCopy, docs);
  }

  /**
   * Tìm bản sao theo mã barcode đơn lẻ
   */
  async findCopyByBarcode(barcode: string): Promise<BookCopy | null> {
    const doc = await this.bookCopyModel.findOne({ barcode }).lean().exec();
    return toEntity(BookCopy, doc);
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

    const filter: Record<string, any> = {};

    if (search && search.trim()) {
      filter.title = buildContainsRegex(search);
    }

    if (categoryId && categoryId.trim()) {
      filter.categoryId = categoryId.trim();
    }

    const targetAuthor = author?.trim() || authorId?.trim();
    if (targetAuthor) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          targetAuthor,
        );
      const matchedAuthors = await this.authorModel
        .find({ name: buildContainsRegex(targetAuthor) }, { id: 1 })
        .lean()
        .exec();
      const matchedAuthorIds = matchedAuthors.map((a) => a.id);

      if (isUuid) {
        filter.authorId = { $in: [...new Set([targetAuthor, ...matchedAuthorIds])] };
      } else {
        if (matchedAuthorIds.length === 0) {
          return [[], 0];
        }
        filter.authorId = { $in: matchedAuthorIds };
      }
    }

    const [docs, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .lean()
        .exec(),
      this.bookModel.countDocuments(filter).exec(),
    ]);

    const books = toEntities(Book, docs);
    await Promise.all([
      this.attachAuthorAndCategory(books),
      this.applyCopyCountsFromDb(books),
    ]);

    return [books, total];
  }

  /**
   * Lấy danh sách tất cả sách
   */
  async findAll(): Promise<Book[]> {
    const docs = await this.bookModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    const books = toEntities(Book, docs);
    await Promise.all([
      this.attachAuthorAndCategory(books),
      this.attachCopies(books, false),
    ]);
    return books.map((book) => this.applyCopyCountsFromRelation(book));
  }

  /**
   * Lưu hoặc cập nhật thông tin sách
   */
  async save(book: Book): Promise<Book> {
    const payload = prepareDocumentForSave(book);
    const saved = await this.bookModel
      .findOneAndUpdate(
        { id: payload.id },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return toEntity(Book, saved) ?? book;
  }

  /**
   * Xóa sách và toàn bộ các đối tượng liên quan (bản sao sách, mục mượn, phiếu mượn rỗng, tiền phạt liên quan)
   * trong một Transaction an toàn. Nếu có bất kỳ bản sao nào đang được mượn thì ném ngoại lệ.
   */
  async deleteBookWithRelations(bookId: string): Promise<boolean> {
    const session = await this.connection.startSession();
    try {
      let deleted = false;
      await session.withTransaction(async () => {
        const bookDoc = await this.bookModel
          .findOne({ id: bookId })
          .session(session)
          .lean()
          .exec();
        const book = toEntity(Book, bookDoc);

        if (!book) {
          throw AppException.notFound(
            `Không tìm thấy sách với ID: ${bookId}`,
            { id: bookId },
            'BOOK_NOT_FOUND',
          );
        }

        await this.attachCopies([book], true, session);
        const copies = book.copies || [];

        const borrowedCopies = copies.filter((copy) => {
          const isCopyBorrowed =
            copy.status === BookCopyStatus.BORROWED ||
            copy.status === BookCopyStatus.RESERVED;
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

        if (copies.length > 0) {
          const copyIds = copies.map((c) => c.id);
          const relatedLoanItems = await this.loanItemModel
            .find({ bookCopyId: { $in: copyIds } })
            .session(session)
            .lean()
            .exec();

          if (relatedLoanItems.length > 0) {
            const affectedLoanIds = [
              ...new Set(relatedLoanItems.map((item) => item.loanId)),
            ];

            await this.loanItemModel
              .deleteMany({ bookCopyId: { $in: copyIds } })
              .session(session)
              .exec();

            for (const loanId of affectedLoanIds) {
              const remainingCount = await this.loanItemModel
                .countDocuments({ loanId })
                .session(session)
                .exec();
              if (remainingCount === 0) {
                await this.fineModel.deleteMany({ loanId }).session(session).exec();
                await this.loanModel.deleteOne({ id: loanId }).session(session).exec();
              }
            }
          }

          await this.bookCopyModel.deleteMany({ bookId }).session(session).exec();
        }

        const deleteResult = await this.bookModel
          .deleteOne({ id: bookId })
          .session(session)
          .exec();
        deleted = (deleteResult.deletedCount ?? 0) > 0;
      });
      return deleted;
    } finally {
      await session.endSession();
    }
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
    const rawResults = await this.loanItemModel
      .aggregate<{ _id: string; returnedCount: number }>([
        { $match: { status: LoanItemStatus.RETURNED } },
        {
          $lookup: {
            from: 'book_copies',
            localField: 'bookCopyId',
            foreignField: 'id',
            as: 'copy',
          },
        },
        { $unwind: '$copy' },
        {
          $group: {
            _id: '$copy.bookId',
            returnedCount: { $sum: 1 },
          },
        },
        { $sort: { returnedCount: -1 } },
        { $limit: limit },
      ])
      .exec();

    if (!rawResults || rawResults.length === 0) {
      return [];
    }

    const bookIds = rawResults.map((r) => r._id).filter(Boolean);
    const bookDocs = await this.bookModel
      .find({ id: { $in: bookIds } })
      .lean()
      .exec();
    const books = toEntities(Book, bookDocs);

    await Promise.all([
      this.attachAuthorAndCategory(books),
      this.attachCopies(books, false),
    ]);

    const bookMap = new Map(
      books.map((b) => [b.id, this.applyCopyCountsFromRelation(b)]),
    );
    return bookIds
      .map((id) => bookMap.get(id))
      .filter((b): b is Book => b !== undefined);
  }
}
