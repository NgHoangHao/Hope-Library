import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Book } from '../model/book/book.entity.js';
import { BookCopy, BookCopyStatus } from '../model/book-copy/book-copy.entity.js';
import { Loan, LoanStatus } from '../model/loan/loan.entity.js';
import { LoanItem, LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import { User } from '../model/user/user.entity.js';

export interface PopularBookRawRow {
  book: Book;
  borrowCount: number;
}

@Injectable()
export class DashboardRepository {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(BookCopy)
    private readonly bookCopyRepo: Repository<BookCopy>,
    @InjectRepository(Loan)
    private readonly loanRepo: Repository<Loan>,
    @InjectRepository(LoanItem)
    private readonly loanItemRepo: Repository<LoanItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Đếm tổng số bản sao sách (BookCopy)
   */
  async countTotalBookCopies(): Promise<number> {
    return this.bookCopyRepo.count();
  }

  /**
   * Đếm số bản sao sách mới tạo từ mốc thời gian cho trước
   */
  async countBookCopiesCreatedSince(since: Date): Promise<number> {
    return this.bookCopyRepo
      .createQueryBuilder('copy')
      .where('copy.createdAt >= :since', { since })
      .getCount();
  }

  /**
   * Đếm tổng số bản sao sách đang được cho mượn (status = BORROWED)
   */
  async countBorrowedBookCopies(): Promise<number> {
    return this.bookCopyRepo.count({
      where: { status: BookCopyStatus.BORROWED },
    });
  }

  /**
   * Đếm tổng số thành viên (Users)
   */
  async countTotalUsers(): Promise<number> {
    return this.userRepo.count();
  }

  /**
   * Đếm số thành viên mới đăng ký từ mốc thời gian cho trước
   */
  async countUsersCreatedSince(since: Date): Promise<number> {
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.createdAt >= :since', { since })
      .getCount();
  }

  /**
   * Đếm số phiếu mượn đang quá hạn
   */
  async countOverdueLoans(now: Date = new Date()): Promise<number> {
    return this.loanRepo
      .createQueryBuilder('loan')
      .where(
        '(loan.status = :overdueStatus OR (loan.status = :borrowedStatus AND loan.dueDate < :now))',
        {
          overdueStatus: LoanStatus.OVERDUE,
          borrowedStatus: LoanStatus.BORROWED,
          now,
        },
      )
      .getCount();
  }

  /**
   * Lấy danh sách phiếu mượn hợp lệ trong khoảng thời gian [from, toExclusive)
   */
  async findLoansInDateRange(
    from: Date,
    toExclusive: Date,
  ): Promise<Pick<Loan, 'id' | 'loanDate'>[]> {
    return this.loanRepo
      .createQueryBuilder('loan')
      .select(['loan.id', 'loan.loanDate'])
      .where('loan.loanDate >= :from AND loan.loanDate < :toExclusive', {
        from,
        toExclusive,
      })
      .andWhere('loan.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [LoanStatus.CANCELLED, LoanStatus.EXPIRED],
      })
      .getMany();
  }

  /**
   * Đếm số phiếu mượn hợp lệ trong khoảng thời gian [from, toExclusive)
   */
  async countLoansInDateRange(from: Date, toExclusive: Date): Promise<number> {
    return this.loanRepo
      .createQueryBuilder('loan')
      .where('loan.loanDate >= :from AND loan.loanDate < :toExclusive', {
        from,
        toExclusive,
      })
      .andWhere('loan.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [LoanStatus.CANCELLED, LoanStatus.EXPIRED],
      })
      .getCount();
  }

  /**
   * Lấy top sách được yêu thích tính theo số lượng LoanItem có status là BORROWED và RETURNED
   */
  async findPopularBooks(limit: number = 3): Promise<PopularBookRawRow[]> {
    const rawResults = await this.loanItemRepo
      .createQueryBuilder('loanItem')
      .innerJoin('loanItem.bookCopy', 'copy')
      .innerJoin('copy.book', 'book')
      .where('loanItem.status IN (:...statuses)', {
        statuses: [LoanItemStatus.BORROWED, LoanItemStatus.RETURNED],
      })
      .select('book.id', 'bookId')
      .addSelect('COUNT(loanItem.id)', 'borrowCount')
      .groupBy('book.id')
      .orderBy('COUNT(loanItem.id)', 'DESC')
      .limit(limit)
      .getRawMany<{ bookId: string; borrowCount: string | number }>();

    if (!rawResults || rawResults.length === 0) {
      return [];
    }

    const bookIds = rawResults.map((row) => row.bookId);
    const books = await this.bookRepo.find({
      where: { id: In(bookIds) },
      relations: { author: true },
    });

    const bookMap = new Map(books.map((book) => [book.id, book]));

    return rawResults
      .map((row) => {
        const book = bookMap.get(row.bookId);
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
    return this.loanRepo.find({
      relations: {
        user: true,
        loanItems: {
          bookCopy: {
            book: true,
          },
        },
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
