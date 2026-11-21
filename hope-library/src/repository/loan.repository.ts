import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Loan, LoanStatus } from '../model/loan/loan.entity.js';
import { LoanItem, LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import { Fine, FineStatus } from '../model/fine/fine.entity.js';
import { BookCopy } from '../model/book-copy/book-copy.entity.js';
import { User } from '../model/user/user.entity.js';

@Injectable()
export class LoanRepository {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepo: Repository<Loan>,
    @InjectRepository(LoanItem)
    private readonly loanItemRepo: Repository<LoanItem>,
    @InjectRepository(Fine)
    private readonly fineRepo: Repository<Fine>,
    @InjectRepository(BookCopy)
    private readonly bookCopyRepo: Repository<BookCopy>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

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

    const qb = this.loanRepo
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.user', 'user')
      .leftJoinAndSelect('loan.loanItems', 'loanItems')
      .leftJoinAndSelect('loanItems.bookCopy', 'bookCopy')
      .leftJoinAndSelect('bookCopy.book', 'book')
      .leftJoinAndSelect('loan.fines', 'fines');

    if (userId && userId.trim()) {
      qb.andWhere('loan.userId = :userId', { userId: userId.trim() });
    }

    if (status) {
      qb.andWhere('loan.status = :status', { status });
    }

    if (search && search.trim()) {
      const keyword = `%${search.trim()}%`;
      qb.andWhere(
        '(user.fullName LIKE :keyword OR user.username LIKE :keyword OR user.email LIKE :keyword OR CAST(loan.id AS NVARCHAR(36)) LIKE :keyword)',
        { keyword },
      );
    }

    return await qb
      .orderBy('loan.createdAt', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();
  }

  /**
   * Tìm chi tiết phiếu mượn theo ID cùng các quan hệ đầy đủ
   */
  async findById(id: string): Promise<Loan | null> {
    return this.loanRepo.findOne({
      where: { id },
      relations: {
        user: true,
        loanItems: {
          bookCopy: {
            book: true,
          },
        },
        fines: true,
      },
    });
  }

  /**
   * Tìm người dùng theo ID
   */
  async findUserById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  /**
   * Tìm các bản sao sách theo danh sách ID
   */
  async findBookCopiesByIds(ids: string[]): Promise<BookCopy[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.bookCopyRepo.find({
      where: { id: In(ids) },
      relations: { book: true },
    });
  }

  /**
   * Đếm tổng số lượng sách người dùng đang giữ hoặc đang chờ lấy (PENDING + BORROWED)
   */
  async countActiveBorrowedBooksByUser(userId: string): Promise<number> {
    const activeStatuses = [LoanStatus.PENDING, LoanStatus.BORROWED];
    const rawCount = await this.loanItemRepo
      .createQueryBuilder('li')
      .innerJoin('li.loan', 'loan')
      .where('loan.userId = :userId', { userId })
      .andWhere('loan.status IN (:...statuses)', { statuses: activeStatuses })
      .andWhere('li.status != :returnedStatus', { returnedStatus: LoanItemStatus.RETURNED })
      .getCount();

    return rawCount;
  }

  /**
   * Kiểm tra người dùng có sách bị quá hạn (OVERDUE) chưa trả hay không
   */
  async hasOverdueLoansByUser(userId: string, now: Date = new Date()): Promise<boolean> {
    const activeStatuses = [LoanStatus.BORROWED];
    const overdueCount = await this.loanRepo
      .createQueryBuilder('loan')
      .where('loan.userId = :userId', { userId })
      .andWhere(
        '(loan.status = :overdueStatus OR (loan.status IN (:...activeStatuses) AND loan.dueDate < :now))',
        {
          overdueStatus: LoanStatus.OVERDUE,
          activeStatuses,
          now,
        },
      )
      .getCount();

    return overdueCount > 0;
  }

  /**
   * Kiểm tra người dùng có khoản tiền phạt nào chưa đóng (UNPAID) hay không
   */
  async hasUnpaidFinesByUser(userId: string): Promise<boolean> {
    const unpaidCount = await this.fineRepo
      .createQueryBuilder('fine')
      .where('fine.userId = :userId', { userId })
      .andWhere('fine.status = :unpaidStatus', { unpaidStatus: FineStatus.UNPAID })
      .andWhere('fine.amount > 0')
      .getCount();

    return unpaidCount > 0;
  }

  /**
   * Tính tổng số tiền phạt chưa thanh toán và số phiếu mượn có phạt chưa thanh toán của người dùng
   */
  async getUnpaidFineSummaryByUser(userId: string): Promise<{
    totalUnpaidFineAmount: number;
    unpaidFineLoansCount: number;
  }> {
    const raw = await this.fineRepo
      .createQueryBuilder('fine')
      .select('COALESCE(SUM(fine.amount), 0)', 'totalAmount')
      .addSelect('COUNT(DISTINCT fine.loanId)', 'unpaidLoansCount')
      .where('fine.userId = :userId', { userId })
      .andWhere('fine.status = :unpaidStatus', { unpaidStatus: FineStatus.UNPAID })
      .andWhere('fine.amount > 0')
      .getRawOne<{
        totalAmount?: string | number | null;
        unpaidLoansCount?: string | number | null;
      }>();

    return {
      totalUnpaidFineAmount: Number(raw?.totalAmount ?? 0),
      unpaidFineLoansCount: Number(raw?.unpaidLoansCount ?? 0),
    };
  }

  /**
   * Tìm các bản sao sách theo danh sách mã vạch (barcodes)
   */
  async findBookCopiesByBarcodes(barcodes: string[]): Promise<BookCopy[]> {
    if (!barcodes || barcodes.length === 0) {
      return [];
    }
    return this.bookCopyRepo.find({
      where: { barcode: In(barcodes) },
      relations: { book: true },
    });
  }

  /**
   * Lấy danh sách các phiếu mượn PENDING đã quá hạn 48h chưa đến lấy
   */
  async findExpiredPendingLoans(cutoffDate: Date = new Date()): Promise<Loan[]> {
    return this.loanRepo
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.loanItems', 'loanItems')
      .leftJoinAndSelect('loanItems.bookCopy', 'bookCopy')
      .leftJoinAndSelect('bookCopy.book', 'book')
      .where('loan.status = :pendingStatus', { pendingStatus: LoanStatus.PENDING })
      .andWhere(
        '((loan.pickupDeadline IS NOT NULL AND loan.pickupDeadline <= :cutoffDate) OR (loan.pickupDeadline IS NULL AND loan.dueDate <= :cutoffDate))',
        { cutoffDate },
      )
      .getMany();
  }

  /**
   * Lấy danh sách các phiếu mượn đang ở trạng thái BORROWED đã quá hạn trả (dueDate < now)
   */
  async findOverdueBorrowedLoans(now: Date = new Date()): Promise<Loan[]> {
    return this.loanRepo
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.loanItems', 'loanItems')
      .leftJoinAndSelect('loanItems.bookCopy', 'bookCopy')
      .leftJoinAndSelect('bookCopy.book', 'book')
      .where('loan.status = :borrowedStatus', { borrowedStatus: LoanStatus.BORROWED })
      .andWhere('loan.dueDate < :now', { now })
      .getMany();
  }

  /**
   * Lấy danh sách các phiếu mượn đang ở trạng thái BORROWED trong khoảng dueDate cần kiểm tra gửi email nhắc nhở
   */
  async findBorrowedLoansForReminder(
    windowStart: Date,
    windowEnd: Date,
  ): Promise<Loan[]> {
    return this.loanRepo
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.user', 'user')
      .leftJoinAndSelect('loan.loanItems', 'loanItems')
      .leftJoinAndSelect('loanItems.bookCopy', 'bookCopy')
      .leftJoinAndSelect('bookCopy.book', 'book')
      .leftJoinAndSelect('book.author', 'author')
      .where('loan.status = :borrowedStatus', { borrowedStatus: LoanStatus.BORROWED })
      .andWhere('loan.dueDate >= :windowStart', { windowStart })
      .andWhere('loan.dueDate < :windowEnd', { windowEnd })
      .getMany();
  }

  /**
   * Chạy thao tác trong Transaction an toàn
   */
  async runInTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(work);
  }
}

