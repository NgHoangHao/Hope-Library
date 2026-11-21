import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import { Loan, LoanStatus } from '../model/loan/loan.entity.js';
import { LoanItem, LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import { Fine, FineStatus } from '../model/fine/fine.entity.js';
import { BookCopy } from '../model/book-copy/book-copy.entity.js';
import { Book } from '../model/book/book.entity.js';
import { Author } from '../model/author/author.entity.js';
import { User } from '../model/user/user.entity.js';
import {
  buildContainsRegex,
  MongoTransactionManager,
  toEntities,
  toEntity,
} from '../database/mongo.helper.js';

@Injectable()
export class LoanRepository {
  constructor(
    @InjectModel(Loan.name)
    private readonly loanModel: Model<Loan>,
    @InjectModel(LoanItem.name)
    private readonly loanItemModel: Model<LoanItem>,
    @InjectModel(Fine.name)
    private readonly fineModel: Model<Fine>,
    @InjectModel(BookCopy.name)
    private readonly bookCopyModel: Model<BookCopy>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,
    @InjectModel(Author.name)
    private readonly authorModel: Model<Author>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  private async hydrateLoans(
    loans: Loan[],
    options: {
      includeUser?: boolean;
      includeItems?: boolean;
      includeFines?: boolean;
      includeAuthor?: boolean;
    } = {},
  ): Promise<Loan[]> {
    if (loans.length === 0) return loans;

    const {
      includeUser = true,
      includeItems = true,
      includeFines = true,
      includeAuthor = false,
    } = options;

    const loanIds = loans.map((l) => l.id);
    const userIds = includeUser
      ? [...new Set(loans.map((l) => l.userId).filter(Boolean))]
      : [];

    const [userDocs, loanItemDocs, fineDocs] = await Promise.all([
      includeUser && userIds.length > 0
        ? this.userModel.find({ id: { $in: userIds } }).lean().exec()
        : Promise.resolve([]),
      includeItems
        ? this.loanItemModel.find({ loanId: { $in: loanIds } }).lean().exec()
        : Promise.resolve([]),
      includeFines
        ? this.fineModel.find({ loanId: { $in: loanIds } }).lean().exec()
        : Promise.resolve([]),
    ]);

    if (includeUser) {
      const userMap = new Map(toEntities(User, userDocs).map((u) => [u.id, u]));
      for (const loan of loans) {
        loan.user = userMap.get(loan.userId);
      }
    }

    if (includeFines) {
      const finesByLoan = new Map<string, Fine[]>();
      for (const fine of toEntities(Fine, fineDocs)) {
        if (!fine.loanId) continue;
        const list = finesByLoan.get(fine.loanId) ?? [];
        list.push(fine);
        finesByLoan.set(fine.loanId, list);
      }
      for (const loan of loans) {
        loan.fines = finesByLoan.get(loan.id) ?? [];
      }
    }

    if (includeItems) {
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
          const books = toEntities(Book, bookDocs);

          if (includeAuthor) {
            const authorIds = [
              ...new Set(
                books
                  .map((b) => b.authorId)
                  .filter((id): id is string => Boolean(id)),
              ),
            ];
            if (authorIds.length > 0) {
              const authorDocs = await this.authorModel
                .find({ id: { $in: authorIds } })
                .lean()
                .exec();
              const authorMap = new Map(
                toEntities(Author, authorDocs).map((a) => [a.id, a]),
              );
              for (const book of books) {
                book.author = book.authorId
                  ? (authorMap.get(book.authorId) ?? null)
                  : null;
              }
            }
          }

          const bookMap = new Map(books.map((b) => [b.id, b]));
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
        loan.loanItems = itemsByLoan.get(loan.id) ?? [];
      }
    }

    return loans;
  }

  /**
   * Truy vấn danh sách phiếu mượn có phân trang, tìm kiếm và lọc
   */
  async findLoans(options: {
    page: number;
    size: number;
    userId?: string;
    status?: LoanStatus;
    search?: string;
  }): Promise<[Loan[], number]> {
    const { page, size, userId, status, search } = options;
    const skip = (page - 1) * size;

    const filter: Record<string, any> = {};

    if (userId && userId.trim()) {
      filter.userId = userId.trim();
    }

    if (status) {
      filter.status = status;
    }

    if (search && search.trim()) {
      const regex = buildContainsRegex(search);
      const matchedUsers = await this.userModel
        .find(
          {
            $or: [
              { fullName: regex },
              { username: regex },
              { email: regex },
            ],
          },
          { id: 1 },
        )
        .lean()
        .exec();
      const matchedUserIds = matchedUsers.map((u) => u.id);

      const searchOr: Record<string, any>[] = [{ id: regex }];
      if (matchedUserIds.length > 0) {
        searchOr.push({ userId: { $in: matchedUserIds } });
      }
      filter.$or = searchOr;
    }

    const [docs, total] = await Promise.all([
      this.loanModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .lean()
        .exec(),
      this.loanModel.countDocuments(filter).exec(),
    ]);

    const loans = await this.hydrateLoans(toEntities(Loan, docs), {
      includeUser: true,
      includeItems: true,
      includeFines: true,
    });

    return [loans, total];
  }

  /**
   * Tìm chi tiết phiếu mượn theo ID cùng các quan hệ đầy đủ
   */
  async findById(id: string): Promise<Loan | null> {
    const doc = await this.loanModel.findOne({ id }).lean().exec();
    const loan = toEntity(Loan, doc);
    if (!loan) return null;

    await this.hydrateLoans([loan], {
      includeUser: true,
      includeItems: true,
      includeFines: true,
    });
    return loan;
  }

  /**
   * Tìm người dùng theo ID
   */
  async findUserById(id: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ id }).lean().exec();
    return toEntity(User, doc);
  }

  /**
   * Tìm các bản sao sách theo danh sách ID
   */
  async findBookCopiesByIds(ids: string[]): Promise<BookCopy[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const copyDocs = await this.bookCopyModel
      .find({ id: { $in: ids } })
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

    return copies;
  }

  /**
   * Đếm tổng số lượng sách người dùng đang giữ hoặc đang chờ lấy (PENDING + BORROWED)
   */
  async countActiveBorrowedBooksByUser(userId: string): Promise<number> {
    const activeLoans = await this.loanModel
      .find(
        {
          userId,
          status: { $in: [LoanStatus.PENDING, LoanStatus.BORROWED] },
        },
        { id: 1 },
      )
      .lean()
      .exec();

    const loanIds = activeLoans.map((l) => l.id);
    if (loanIds.length === 0) return 0;

    return this.loanItemModel
      .countDocuments({
        loanId: { $in: loanIds },
        status: { $ne: LoanItemStatus.RETURNED },
      })
      .exec();
  }

  /**
   * Kiểm tra người dùng có sách bị quá hạn (OVERDUE) chưa trả hay không
   */
  async hasOverdueLoansByUser(userId: string, now: Date = new Date()): Promise<boolean> {
    const overdueCount = await this.loanModel
      .countDocuments({
        userId,
        $or: [
          { status: LoanStatus.OVERDUE },
          { status: LoanStatus.BORROWED, dueDate: { $lt: now } },
        ],
      })
      .exec();

    return overdueCount > 0;
  }

  /**
   * Kiểm tra người dùng có khoản tiền phạt nào chưa đóng (UNPAID) hay không
   */
  async hasUnpaidFinesByUser(userId: string): Promise<boolean> {
    const unpaidCount = await this.fineModel
      .countDocuments({
        userId,
        status: FineStatus.UNPAID,
        amount: { $gt: 0 },
      })
      .exec();

    return unpaidCount > 0;
  }

  /**
   * Tính tổng số tiền phạt chưa thanh toán và số phiếu mượn có phạt chưa thanh toán của người dùng
   */
  async getUnpaidFineSummaryByUser(userId: string): Promise<{
    totalUnpaidFineAmount: number;
    unpaidFineLoansCount: number;
  }> {
    const [raw] = await this.fineModel
      .aggregate<{
        totalAmount: number;
        loanIds: (string | null)[];
      }>([
        {
          $match: {
            userId,
            status: FineStatus.UNPAID,
            amount: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            loanIds: { $addToSet: '$loanId' },
          },
        },
      ])
      .exec();

    const distinctLoanIds = (raw?.loanIds ?? []).filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );

    return {
      totalUnpaidFineAmount: Number(raw?.totalAmount ?? 0),
      unpaidFineLoansCount: distinctLoanIds.length,
    };
  }

  /**
   * Tìm các bản sao sách theo danh sách mã vạch (barcodes)
   */
  async findBookCopiesByBarcodes(barcodes: string[]): Promise<BookCopy[]> {
    if (!barcodes || barcodes.length === 0) {
      return [];
    }
    const copyDocs = await this.bookCopyModel
      .find({ barcode: { $in: barcodes } })
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

    return copies;
  }

  /**
   * Lấy danh sách các phiếu mượn PENDING đã quá hạn 48h chưa đến lấy
   */
  async findExpiredPendingLoans(cutoffDate: Date = new Date()): Promise<Loan[]> {
    const docs = await this.loanModel
      .find({
        status: LoanStatus.PENDING,
        $or: [
          { pickupDeadline: { $ne: null, $lte: cutoffDate } },
          { pickupDeadline: null, dueDate: { $lte: cutoffDate } },
          { pickupDeadline: { $exists: false }, dueDate: { $lte: cutoffDate } },
        ],
      })
      .lean()
      .exec();

    return this.hydrateLoans(toEntities(Loan, docs), {
      includeUser: false,
      includeItems: true,
      includeFines: false,
    });
  }

  /**
   * Lấy danh sách các phiếu mượn đang ở trạng thái BORROWED đã quá hạn trả (dueDate < now)
   */
  async findOverdueBorrowedLoans(now: Date = new Date()): Promise<Loan[]> {
    const docs = await this.loanModel
      .find({
        status: LoanStatus.BORROWED,
        dueDate: { $lt: now },
      })
      .lean()
      .exec();

    return this.hydrateLoans(toEntities(Loan, docs), {
      includeUser: false,
      includeItems: true,
      includeFines: false,
    });
  }

  /**
   * Lấy danh sách các phiếu mượn đang ở trạng thái BORROWED trong khoảng dueDate cần kiểm tra gửi email nhắc nhở
   */
  async findBorrowedLoansForReminder(
    windowStart: Date,
    windowEnd: Date,
  ): Promise<Loan[]> {
    const docs = await this.loanModel
      .find({
        status: LoanStatus.BORROWED,
        dueDate: { $gte: windowStart, $lt: windowEnd },
      })
      .lean()
      .exec();

    return this.hydrateLoans(toEntities(Loan, docs), {
      includeUser: true,
      includeItems: true,
      includeFines: false,
      includeAuthor: true,
    });
  }

  /**
   * Chạy thao tác trong Transaction an toàn (MongoDB Atlas Replica Set Session)
   */
  async runInTransaction<T>(
    work: (manager: MongoTransactionManager) => Promise<T>,
  ): Promise<T> {
    const session = await this.connection.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        const manager = new MongoTransactionManager(this.connection, session);
        result = await work(manager);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
}
