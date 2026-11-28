import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Book } from '../model/book/book.entity.js';
import { BookCopy, BookCopyStatus } from '../model/book-copy/book-copy.entity.js';
import { Author } from '../model/author/author.entity.js';
import { Loan, LoanStatus } from '../model/loan/loan.entity.js';
import { LoanItem, LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import { User } from '../model/user/user.entity.js';
import { toEntities } from '../database/mongo.helper.js';

export interface PopularBookRawRow {
  book: Book;
  borrowCount: number;
}

@Injectable()
export class DashboardRepository {
  constructor(
    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,
    @InjectModel(BookCopy.name)
    private readonly bookCopyModel: Model<BookCopy>,
    @InjectModel(Author.name)
    private readonly authorModel: Model<Author>,
    @InjectModel(Loan.name)
    private readonly loanModel: Model<Loan>,
    @InjectModel(LoanItem.name)
    private readonly loanItemModel: Model<LoanItem>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  /**
   * Đếm tổng số bản sao sách (BookCopy)
   */
  async countTotalBookCopies(): Promise<number> {
    return this.bookCopyModel.countDocuments().exec();
  }

  /**
   * Đếm số bản sao sách mới tạo từ mốc thời gian cho trước
   */
  async countBookCopiesCreatedSince(since: Date): Promise<number> {
    return this.bookCopyModel
      .countDocuments({ createdAt: { $gte: since } })
      .exec();
  }

  /**
   * Đếm tổng số bản sao sách đang được cho mượn (status = BORROWED)
   */
  async countBorrowedBookCopies(): Promise<number> {
    return this.bookCopyModel
      .countDocuments({ status: BookCopyStatus.BORROWED })
      .exec();
  }

  /**
   * Đếm tổng số thành viên (Users)
   */
  async countTotalUsers(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  /**
   * Đếm số thành viên mới đăng ký từ mốc thời gian cho trước
   */
  async countUsersCreatedSince(since: Date): Promise<number> {
    return this.userModel
      .countDocuments({ createdAt: { $gte: since } })
      .exec();
  }

  /**
   * Đếm số phiếu mượn đang quá hạn theo đúng trạng thái OVERDUE trong DB
   */
  async countOverdueLoans(): Promise<number> {
    return this.loanModel
      .countDocuments({ status: LoanStatus.OVERDUE })
      .exec();
  }

  /**
   * Lấy danh sách phiếu mượn hợp lệ trong khoảng thời gian [from, toExclusive)
   */
  async findLoansInDateRange(
    from: Date,
    toExclusive: Date,
  ): Promise<Pick<Loan, 'id' | 'loanDate'>[]> {
    const docs = await this.loanModel
      .find(
        {
          loanDate: { $gte: from, $lt: toExclusive },
          status: { $nin: [LoanStatus.CANCELLED, LoanStatus.EXPIRED] },
        },
        { id: 1, loanDate: 1 },
      )
      .lean()
      .exec();

    return docs.map((d) => ({
      id: d.id,
      loanDate: d.loanDate,
    }));
  }

  /**
   * Đếm số phiếu mượn hợp lệ trong khoảng thời gian [from, toExclusive)
   */
  async countLoansInDateRange(from: Date, toExclusive: Date): Promise<number> {
    return this.loanModel
      .countDocuments({
        loanDate: { $gte: from, $lt: toExclusive },
        status: { $nin: [LoanStatus.CANCELLED, LoanStatus.EXPIRED] },
      })
      .exec();
  }

  /**
   * Lấy top sách được yêu thích tính theo số lượng LoanItem có status là BORROWED và RETURNED
   */
  async findPopularBooks(limit: number = 3): Promise<PopularBookRawRow[]> {
    const rawResults = await this.loanItemModel
      .aggregate<{ _id: string; borrowCount: number }>([
        {
          $match: {
            status: { $in: [LoanItemStatus.BORROWED, LoanItemStatus.RETURNED] },
          },
        },
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
            borrowCount: { $sum: 1 },
          },
        },
        { $sort: { borrowCount: -1 } },
        { $limit: limit },
      ])
      .exec();

    if (!rawResults || rawResults.length === 0) {
      return [];
    }

    const bookIds = rawResults.map((row) => row._id).filter(Boolean);
    const bookDocs = await this.bookModel
      .find({ id: { $in: bookIds } })
      .lean()
      .exec();
    const books = toEntities(Book, bookDocs);

    const authorIds = [
      ...new Set(books.map((b) => b.authorId).filter((id): id is string => Boolean(id))),
    ];
    if (authorIds.length > 0) {
      const authorDocs = await this.authorModel
        .find({ id: { $in: authorIds } })
        .lean()
        .exec();
      const authorMap = new Map(toEntities(Author, authorDocs).map((a) => [a.id, a]));
      for (const book of books) {
        book.author = book.authorId ? (authorMap.get(book.authorId) ?? null) : null;
      }
    }

    const bookMap = new Map(books.map((book) => [book.id, book]));

    return rawResults
      .map((row) => {
        const book = bookMap.get(row._id);
        if (!book) return null;
        return {
          book,
          borrowCount: Number(row.borrowCount) || 0,
        };
      })
      .filter((item): item is PopularBookRawRow => item !== null);
  }

  /**
   * Lấy danh sách phiếu mượn gần đây nhất
   */
  async findRecentLoans(limit: number = 5): Promise<Loan[]> {
    const loanDocs = await this.loanModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    const loans = toEntities(Loan, loanDocs);
    if (loans.length === 0) return [];

    const loanIds = loans.map((l) => l.id);
    const userIds = [...new Set(loans.map((l) => l.userId).filter(Boolean))];

    const [userDocs, loanItemDocs] = await Promise.all([
      userIds.length > 0
        ? this.userModel.find({ id: { $in: userIds } }).lean().exec()
        : Promise.resolve([]),
      this.loanItemModel.find({ loanId: { $in: loanIds } }).lean().exec(),
    ]);

    const userMap = new Map(toEntities(User, userDocs).map((u) => [u.id, u]));
    const loanItems = toEntities(LoanItem, loanItemDocs);

    const copyIds = [...new Set(loanItems.map((li) => li.bookCopyId).filter(Boolean))];
    if (copyIds.length > 0) {
      const copyDocs = await this.bookCopyModel
        .find({ id: { $in: copyIds } })
        .lean()
        .exec();
      const copies = toEntities(BookCopy, copyDocs);

      const bookIds = [...new Set(copies.map((c) => c.bookId).filter(Boolean))];
      if (bookIds.length > 0) {
        const bookDocs = await this.bookModel
          .find({ id: { $in: bookIds } })
          .lean()
          .exec();
        const bookMap = new Map(toEntities(Book, bookDocs).map((b) => [b.id, b]));
        for (const copy of copies) {
          copy.book = bookMap.get(copy.bookId);
        }
      }

      const copyMap = new Map(copies.map((c) => [c.id, c]));
      for (const li of loanItems) {
        li.bookCopy = copyMap.get(li.bookCopyId);
      }
    }

    const itemsByLoan = new Map<string, LoanItem[]>();
    for (const li of loanItems) {
      const list = itemsByLoan.get(li.loanId) ?? [];
      list.push(li);
      itemsByLoan.set(li.loanId, list);
    }

    for (const loan of loans) {
      loan.user = userMap.get(loan.userId);
      loan.loanItems = itemsByLoan.get(loan.id) ?? [];
    }

    return loans;
  }
}
