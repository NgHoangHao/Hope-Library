import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoanRepository } from '../repository/loan.repository.js';
import { LoanMapper } from '../mapper/loan.mapper.js';
import { Loan, LoanStatus } from '../model/loan/loan.entity.js';
import { LoanItem, LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import { Fine, FineStatus } from '../model/fine/fine.entity.js';
import { BookCopy, BookCopyStatus } from '../model/book-copy/book-copy.entity.js';
import { Book } from '../model/book/book.entity.js';
import { UserStatus } from '../model/user/user.entity.js';
import { RedisService } from '../utils/redis.service.js';
import { MailService, type OverdueReminderBookItem } from '../utils/mail.service.js';
import { SystemConfigService } from './system-config.service.js';
import {
  CreateLoanDto,
  FulfillLoanDto,
  LoanDetailResponse,
  PaginatedLoanResponse,
  QueryLoanDto,
  ReserveBookDto,
  UpdateLoanDto,
} from '../model/loan/loan.dto.js';
import { AppException } from '../common/index.js';

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);
  private static readonly RESERVATION_EXPIRATION_HOURS_CONFIG_KEY = 'RESERVATION_EXPIRATION_HOURS';
  private static readonly OVERDUE_FINE_PER_DAY_CONFIG_KEY = 'OVERDUE_FINE_PER_DAY';
  private static readonly MAX_BORROW_BOOKS_CONFIG_KEY = 'MAX_BORROW_BOOKS';
  private static readonly OVERDUE_REMINDER_BEFORE_DAYS_CONFIG_KEY =
    'OVERDUE_REMINDER_BEFORE_DAYS';

  constructor(
    private readonly loanRepo: LoanRepository,
    private readonly loanMapper: LoanMapper,
    @Optional() private readonly redisService?: RedisService,
    @Optional() private readonly configService?: ConfigService,
    @Optional() private readonly systemConfigService?: SystemConfigService,
    @Optional() private readonly mailService?: MailService,
  ) { }

  /**
   * Lấy thời gian lấy sách tối đa cho phiếu đặt trước (giờ):
   * - Ưu tiên đọc từ SystemConfigService (Redis cache -> DB) theo key `RESERVATION_EXPIRATION_HOURS`
   * - Nếu null/không tồn tại hoặc lỗi -> fallback sang biến môi trường `RESERVATION_EXPIRATION_HOURS`
   */
  private async getReservationExpirationHours(): Promise<number> {
    const envRaw =
      this.configService?.get<string>(
        LoanService.RESERVATION_EXPIRATION_HOURS_CONFIG_KEY,
        '48',
      ) ??
      process.env[LoanService.RESERVATION_EXPIRATION_HOURS_CONFIG_KEY] ??
      '48';
    const envParsed = Number(envRaw);
    const envFallback = Number.isFinite(envParsed) && envParsed > 0 ? envParsed : 48;

    if (!this.systemConfigService) {
      return envFallback;
    }

    try {
      const rawValue = await this.systemConfigService.getValue(
        LoanService.RESERVATION_EXPIRATION_HOURS_CONFIG_KEY,
      );
      if (rawValue === null || rawValue === undefined || rawValue.trim() === '') {
        return envFallback;
      }

      const parsed = Number(rawValue);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : envFallback;
    } catch (error: any) {
      this.logger.warn(
        `Không thể đọc cấu hình ${LoanService.RESERVATION_EXPIRATION_HOURS_CONFIG_KEY} từ SystemConfig, fallback sang env (${envFallback} giờ): ${error?.message ?? error}`,
      );
      return envFallback;
    }
  }

  /**
   * Lấy mức tiền phạt quá hạn 1 ngày:
   * - Ưu tiên đọc từ SystemConfigService (Redis cache -> DB) theo key `OVERDUE_FINE_PER_DAY`
   * - Nếu null/không tồn tại hoặc lỗi -> fallback sang biến môi trường `OVERDUE_FINE_PER_DAY`
   */
  private async getOverdueFinePerDay(): Promise<number> {
    const envRaw =
      this.configService?.get<string>(LoanService.OVERDUE_FINE_PER_DAY_CONFIG_KEY) ??
      process.env[LoanService.OVERDUE_FINE_PER_DAY_CONFIG_KEY];
    const envParsed = Number(envRaw);
    const envFallback = Number.isFinite(envParsed) && envParsed > 0 ? envParsed : 5000;

    if (!this.systemConfigService) {
      return envFallback;
    }

    try {
      const rawValue = await this.systemConfigService.getValue(
        LoanService.OVERDUE_FINE_PER_DAY_CONFIG_KEY,
      );
      if (rawValue === null || rawValue === undefined || rawValue.trim() === '') {
        return envFallback;
      }

      const parsed = Number(rawValue);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : envFallback;
    } catch (error: any) {
      this.logger.warn(
        `Không thể đọc cấu hình ${LoanService.OVERDUE_FINE_PER_DAY_CONFIG_KEY} từ SystemConfig, fallback sang env (${envFallback}): ${error?.message ?? error}`,
      );
      return envFallback;
    }
  }

  /**
   * Lấy số lượng sách tối đa được phép mượn/đặt giữ chỗ cùng lúc:
   * - Ưu tiên đọc từ SystemConfigService (Redis cache -> DB) theo key `MAX_BORROW_BOOKS`
   * - Nếu null/không tồn tại hoặc lỗi -> fallback sang biến môi trường `MAX_BORROW_BOOKS`
   */
  private async getMaxBorrowBooks(): Promise<number> {
    const envRaw =
      this.configService?.get<string>(LoanService.MAX_BORROW_BOOKS_CONFIG_KEY, '3') ??
      process.env[LoanService.MAX_BORROW_BOOKS_CONFIG_KEY] ??
      '3';
    const envParsed = Number(envRaw);
    const envFallback = Number.isFinite(envParsed) && envParsed > 0 ? envParsed : 3;

    if (!this.systemConfigService) {
      return envFallback;
    }

    try {
      const rawValue = await this.systemConfigService.getValue(
        LoanService.MAX_BORROW_BOOKS_CONFIG_KEY,
      );
      if (rawValue === null || rawValue === undefined || rawValue.trim() === '') {
        return envFallback;
      }

      const parsed = Number(rawValue);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : envFallback;
    } catch (error: any) {
      this.logger.warn(
        `Không thể đọc cấu hình ${LoanService.MAX_BORROW_BOOKS_CONFIG_KEY} từ SystemConfig, fallback sang env (${envFallback} cuốn): ${error?.message ?? error}`,
      );
      return envFallback;
    }
  }

  /**
   * Lấy số ngày gửi email nhắc nhở trước hạn chót trả sách:
   * - Ưu tiên đọc từ SystemConfigService (Redis cache -> DB) theo key `OVERDUE_REMINDER_BEFORE_DAYS`
   * - Nếu null/không tồn tại hoặc lỗi -> fallback sang biến môi trường `OVERDUE_REMINDER_BEFORE_DAYS` (mặc định 1 ngày)
   */
  private async getOverdueReminderBeforeDays(): Promise<number> {
    const envRaw =
      this.configService?.get<string>(
        LoanService.OVERDUE_REMINDER_BEFORE_DAYS_CONFIG_KEY,
        '1',
      ) ??
      process.env[LoanService.OVERDUE_REMINDER_BEFORE_DAYS_CONFIG_KEY] ??
      '1';
    const envParsed = Number(envRaw);
    const envFallback = Number.isFinite(envParsed) && envParsed > 0 ? Math.floor(envParsed) : 1;

    if (!this.systemConfigService) {
      return envFallback;
    }

    try {
      const rawValue = await this.systemConfigService.getValue(
        LoanService.OVERDUE_REMINDER_BEFORE_DAYS_CONFIG_KEY,
      );
      if (rawValue === null || rawValue === undefined || rawValue.trim() === '') {
        return envFallback;
      }

      const parsed = Number(rawValue);
      return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : envFallback;
    } catch (error: any) {
      this.logger.warn(
        `Không thể đọc cấu hình ${LoanService.OVERDUE_REMINDER_BEFORE_DAYS_CONFIG_KEY} từ SystemConfig, fallback sang env (${envFallback} ngày): ${error?.message ?? error}`,
      );
      return envFallback;
    }
  }

  /**
   * Lấy danh sách phiếu mượn có phân trang, tìm kiếm và lọc
   */
  async getAllLoans(query?: QueryLoanDto): Promise<PaginatedLoanResponse> {
    const pageNumber = Math.max(1, Number(query?.page) || 1);
    const pageSize = Math.max(1, Number(query?.size) || 10);
    const trimmedUserId = query?.userId?.trim();

    const [[loans, total], unpaidFineSummary] = await Promise.all([
      this.loanRepo.findLoans({
        page: pageNumber,
        size: pageSize,
        userId: trimmedUserId,
        status: query?.status,
        search: query?.search,
      }),
      trimmedUserId
        ? this.loanRepo.getUnpaidFineSummaryByUser(trimmedUserId)
        : Promise.resolve(undefined),
    ]);

    return this.loanMapper.toPaginatedResponse(
      loans,
      total,
      pageNumber,
      pageSize,
      unpaidFineSummary,
    );
  }

  /**
   * Lấy thông tin chi tiết một phiếu mượn theo ID
   */
  async getLoanById(id: string): Promise<LoanDetailResponse> {
    const loan = await this.loanRepo.findById(id);
    if (!loan) {
      throw AppException.notFound(
        `Không tìm thấy phiếu mượn với ID: ${id}`,
        { id },
        'LOAN_NOT_FOUND',
      );
    }
    return this.loanMapper.toDetailResponse(loan);
  }

  /**
   * Tạo mới phiếu mượn (nhận loanRequest và 1 list LoanItemRequest)
   */
  async createLoan(dto: CreateLoanDto): Promise<LoanDetailResponse> {
    // 1. Kiểm tra userId
    if (!dto.userId || !dto.userId.trim()) {
      throw AppException.badRequest(
        'Mã người dùng (userId) không được để trống',
        { field: 'userId' },
        'USER_ID_REQUIRED',
      );
    }

    const user = await this.loanRepo.findUserById(dto.userId.trim());
    if (!user) {
      throw AppException.notFound(
        `Không tìm thấy người dùng với ID: ${dto.userId}`,
        { userId: dto.userId },
        'USER_NOT_FOUND',
      );
    }

    // 2. Kiểm tra hạn trả sách (dueDate)
    if (!dto.dueDate) {
      throw AppException.badRequest(
        'Hạn trả sách (dueDate) là bắt buộc',
        { field: 'dueDate' },
        'DUE_DATE_REQUIRED',
      );
    }

    const loanDate = dto.loanDate ? new Date(dto.loanDate) : new Date();
    const dueDate = new Date(dto.dueDate);

    if (isNaN(loanDate.getTime())) {
      throw AppException.badRequest(
        'Ngày mượn sách không hợp lệ',
        { loanDate: dto.loanDate },
        'INVALID_LOAN_DATE',
      );
    }

    if (isNaN(dueDate.getTime())) {
      throw AppException.badRequest(
        'Hạn trả sách không hợp lệ',
        { dueDate: dto.dueDate },
        'INVALID_DUE_DATE',
      );
    }

    if (dueDate <= loanDate) {
      throw AppException.badRequest(
        'Hạn trả sách phải sau ngày mượn',
        { loanDate, dueDate },
        'DUE_DATE_MUST_BE_AFTER_LOAN_DATE',
      );
    }

    // 3. Kiểm tra danh sách items
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw AppException.badRequest(
        'Danh sách sách mượn (items) không được để trống',
        { items: dto.items },
        'LOAN_ITEMS_REQUIRED',
      );
    }

    // 4. Kiểm tra trùng lặp bản sao sách trong request
    const copyIds = dto.items.map((i) => i.bookCopyId?.trim()).filter(Boolean);
    if (copyIds.length !== dto.items.length) {
      throw AppException.badRequest(
        'Mỗi mục mượn phải chứa bookCopyId hợp lệ',
        { items: dto.items },
        'INVALID_BOOK_COPY_ID',
      );
    }

    const duplicates = copyIds.filter((id, index) => copyIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      throw AppException.badRequest(
        'Danh sách mượn chứa mã bản sao sách trùng lặp',
        { duplicates: [...new Set(duplicates)] },
        'DUPLICATE_BOOK_COPY_IN_REQUEST',
      );
    }

    // 5. Khóa phân tán trên Redis cho từng cuốn sách (SET NX PX) để chống Librarian và Borrower mượn trùng cuốn cùng thời điểm
    const acquiredLocks: { key: string; token: string }[] = [];
    try {
      if (this.redisService) {
        for (const copyId of copyIds) {
          const lockKey = `lock:book-copy:${copyId}`;
          const token = await this.redisService.acquireLock(lockKey, 15000);
          if (!token) {
            throw AppException.conflict(
              'Bản sao sách đang được độc giả khác giữ chỗ hoặc mượn. Vui lòng thử lại sau giây lát.',
              { bookCopyId: copyId },
              'BOOK_COPY_LOCKED',
            );
          }
          acquiredLocks.push({ key: lockKey, token });
        }
      }

      // 6. Kiểm tra tồn tại và tính khả dụng của từng bản sao sách
      const bookCopies = await this.loanRepo.findBookCopiesByIds(copyIds);
      if (bookCopies.length !== copyIds.length) {
        const foundIds = new Set(bookCopies.map((c) => c.id));
        const missingIds = copyIds.filter((id) => !foundIds.has(id));
        throw AppException.notFound(
          'Một hoặc nhiều bản sao sách không tồn tại trong hệ thống',
          { missingIds },
          'BOOK_COPY_NOT_FOUND',
        );
      }

      for (const itemDto of dto.items) {
        const copy = bookCopies.find((c) => c.id === itemDto.bookCopyId.trim())!;
        const itemStatus = itemDto.status ?? LoanItemStatus.BORROWED;
        if (itemStatus === LoanItemStatus.BORROWED && copy.status !== BookCopyStatus.AVAILABLE) {
          throw AppException.conflict(
            `Bản sao sách '${copy.barcode}' hiện không khả dụng để mượn (trạng thái hiện tại: ${copy.status})`,
            { bookCopyId: copy.id, barcode: copy.barcode, status: copy.status },
            'BOOK_COPY_NOT_AVAILABLE',
          );
        }
        if (copy.book && copy.book.availableCopies <= 0) {
          throw AppException.conflict(
            `Đầu sách '${copy.book.title}' hiện đã hết số lượng khả dụng trong thư viện`,
            { bookId: copy.bookId, title: copy.book.title },
            'BOOK_OUT_OF_STOCK',
          );
        }
      }

      // 7. Thực hiện lưu phiếu mượn và cập nhật trạng thái bản sao trong Transaction
      const savedLoan = await this.loanRepo.runInTransaction(async (manager) => {
        const loan = manager.create(Loan, {
          userId: dto.userId.trim(),
          loanDate,
          dueDate,
          status: dto.status ?? LoanStatus.BORROWED,
          notes: dto.notes?.trim() || null,
        });

        const createdLoan = await manager.save(Loan, loan);

        const loanItems: LoanItem[] = [];
        for (const itemDto of dto.items) {
          const itemStatus = itemDto.status ?? LoanItemStatus.BORROWED;
          const loanItem = manager.create(LoanItem, {
            loanId: createdLoan.id,
            bookCopyId: itemDto.bookCopyId.trim(),
            status: itemStatus,
          });
          loanItems.push(loanItem);

          // Cập nhật trạng thái bản sao sách
          const copy = bookCopies.find((c) => c.id === itemDto.bookCopyId.trim())!;
          if (itemStatus === LoanItemStatus.BORROWED) {
            copy.status = BookCopyStatus.BORROWED;
            await manager.save(BookCopy, copy);
            if (copy.bookId) {
              await manager.decrement(Book, { id: copy.bookId }, 'availableCopies', 1);
            }
          }
        }

        await manager.save(LoanItem, loanItems);
        return createdLoan;
      });

      const fullLoan = await this.loanRepo.findById(savedLoan.id);
      return this.loanMapper.toDetailResponse(fullLoan!);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error(`Lỗi khi tạo phiếu mượn: ${(error as Error).message}`);
      throw AppException.internal(
        'Đã có lỗi hệ thống xảy ra khi tạo phiếu mượn sách',
        { error: (error as Error).message },
        'CREATE_LOAN_FAILED',
      );
    } finally {
      // Luôn giải phóng khóa phân tán khi hoàn tất hoặc gặp lỗi
      if (this.redisService && acquiredLocks.length > 0) {
        for (const lock of acquiredLocks) {
          await this.redisService.releaseLock(lock.key, lock.token);
        }
      }
    }
  }

  /**
   * Cập nhật phiếu mượn và đồng thời cập nhật luôn danh sách LoanItem của Loan
   */
  async updateLoan(id: string, dto: UpdateLoanDto): Promise<LoanDetailResponse> {
    if (
      dto &&
      'status' in dto &&
      (dto as Record<string, unknown>).status !== undefined
    ) {
      throw AppException.badRequest(
        'Không được phép cập nhật trực tiếp trạng thái (status) của phiếu mượn. Chỉ được cập nhật trạng thái của từng mục mượn (items[].status); khi tất cả mục mượn có trạng thái RETURNED, phiếu mượn sẽ tự động chuyển sang RETURNED.',
        { field: 'status' },
        'LOAN_STATUS_DIRECT_UPDATE_NOT_ALLOWED',
      );
    }

    const existingLoan = await this.loanRepo.findById(id);
    if (!existingLoan) {
      throw AppException.notFound(
        `Không tìm thấy phiếu mượn với ID: ${id}`,
        { id },
        'LOAN_NOT_FOUND',
      );
    }

    if (dto.userId) {
      const user = await this.loanRepo.findUserById(dto.userId.trim());
      if (!user) {
        throw AppException.notFound(
          `Không tìm thấy người dùng với ID: ${dto.userId}`,
          { userId: dto.userId },
          'USER_NOT_FOUND',
        );
      }
    }

    try {
      await this.loanRepo.runInTransaction(async (manager) => {
        // 1. Cập nhật các trường cơ bản của Loan
        if (dto.userId) existingLoan.userId = dto.userId.trim();
        if (dto.loanDate) existingLoan.loanDate = new Date(dto.loanDate);
        if (dto.dueDate) existingLoan.dueDate = new Date(dto.dueDate);
        if (dto.returnDate !== undefined) {
          existingLoan.returnDate = dto.returnDate ? new Date(dto.returnDate) : null;
        }
        if (dto.notes !== undefined) {
          existingLoan.notes = dto.notes ? dto.notes.trim() : null;
        }

        // 2. Cập nhật danh sách LoanItem nếu được truyền lên
        if (dto.items !== undefined) {
          const currentItems = existingLoan.loanItems ?? [];
          const currentItemMap = new Map(currentItems.map((i) => [i.id, i]));
          const updatedCopyIds = dto.items.map((i) => i.bookCopyId?.trim()).filter(Boolean);

          // Kiểm tra trùng lặp copyId trong danh sách mới
          const duplicates = updatedCopyIds.filter(
            (cid, idx) => updatedCopyIds.indexOf(cid) !== idx,
          );
          if (duplicates.length > 0) {
            throw AppException.badRequest(
              'Danh sách mượn cập nhật chứa mã bản sao sách trùng lặp',
              { duplicates: [...new Set(duplicates)] },
              'DUPLICATE_BOOK_COPY_IN_REQUEST',
            );
          }

          // Lấy tất cả bản sao liên quan
          const allCopyIds = [
            ...new Set([...currentItems.map((i) => i.bookCopyId), ...updatedCopyIds]),
          ];
          const allCopies =
            allCopyIds.length > 0
              ? await manager.find(BookCopy, {
                where: { id: { $in: allCopyIds } },
                relations: { book: true },
              })
              : [];
          const copyMap = new Map(allCopies.map((c) => [c.id, c]));

          const requestedItemIds = new Set(
            dto.items.map((i) => i.id).filter((itemUuid): itemUuid is string => !!itemUuid),
          );

          // (a) Xóa các LoanItem không còn trong danh sách gửi lên
          for (const currentItem of currentItems) {
            if (!requestedItemIds.has(currentItem.id)) {
              if (currentItem.status === LoanItemStatus.BORROWED) {
                const copy = copyMap.get(currentItem.bookCopyId);
                if (
                  copy &&
                  (copy.status === BookCopyStatus.BORROWED ||
                    copy.status === BookCopyStatus.RESERVED)
                ) {
                  copy.status = BookCopyStatus.AVAILABLE;
                  await manager.save(BookCopy, copy);
                  if (copy.bookId) {
                    await manager.increment(Book, { id: copy.bookId }, 'availableCopies', 1);
                  }
                }
              }
              await manager.delete(LoanItem, { id: currentItem.id });
            }
          }

          // (b) Cập nhật item hiện có hoặc tạo mới item
          for (const itemDto of dto.items) {
            const targetStatus = itemDto.status ?? LoanItemStatus.BORROWED;
            const targetReturnedDate =
              targetStatus === LoanItemStatus.RETURNED
                ? itemDto.returnedDate
                  ? new Date(itemDto.returnedDate)
                  : new Date()
                : itemDto.returnedDate
                  ? new Date(itemDto.returnedDate)
                  : null;

            if (itemDto.id && currentItemMap.has(itemDto.id)) {
              // Cập nhật LoanItem đã tồn tại
              const item = currentItemMap.get(itemDto.id)!;
              const oldStatus = item.status;
              const copy = copyMap.get(item.bookCopyId);

              item.status = targetStatus;
              item.returnedDate = targetReturnedDate;

              // Xử lý chuyển đổi trạng thái bản sao sách
              if (copy) {
                if (
                  oldStatus === LoanItemStatus.BORROWED &&
                  targetStatus === LoanItemStatus.RETURNED
                ) {
                  if (
                    copy.status === BookCopyStatus.BORROWED ||
                    copy.status === BookCopyStatus.RESERVED
                  ) {
                    copy.status = BookCopyStatus.AVAILABLE;
                    await manager.save(BookCopy, copy);
                    if (copy.bookId) {
                      await manager.increment(Book, { id: copy.bookId }, 'availableCopies', 1);
                    }
                  }
                } else if (
                  oldStatus === LoanItemStatus.BORROWED &&
                  (targetStatus === LoanItemStatus.LOST || targetStatus === LoanItemStatus.DAMAGED)
                ) {
                  copy.status =
                    targetStatus === LoanItemStatus.LOST
                      ? BookCopyStatus.LOST
                      : BookCopyStatus.DAMAGED;
                  await manager.save(BookCopy, copy);
                } else if (
                  oldStatus !== LoanItemStatus.BORROWED &&
                  targetStatus === LoanItemStatus.BORROWED
                ) {
                  if (copy.status === BookCopyStatus.AVAILABLE) {
                    copy.status = BookCopyStatus.BORROWED;
                    await manager.save(BookCopy, copy);
                    if (copy.bookId) {
                      await manager.decrement(Book, { id: copy.bookId }, 'availableCopies', 1);
                    }
                  }
                }
              }
              await manager.save(LoanItem, item);
            } else {
              // Thêm mới LoanItem cho phiếu mượn này
              const copy = copyMap.get(itemDto.bookCopyId.trim());
              if (!copy) {
                throw AppException.notFound(
                  `Bản sao sách với ID '${itemDto.bookCopyId}' không tồn tại`,
                  { bookCopyId: itemDto.bookCopyId },
                  'BOOK_COPY_NOT_FOUND',
                );
              }
              if (
                targetStatus === LoanItemStatus.BORROWED &&
                copy.status !== BookCopyStatus.AVAILABLE
              ) {
                throw AppException.conflict(
                  `Bản sao sách '${copy.barcode}' không khả dụng để mượn (trạng thái: ${copy.status})`,
                  { bookCopyId: copy.id, barcode: copy.barcode },
                  'BOOK_COPY_NOT_AVAILABLE',
                );
              }

              const newItem = manager.create(LoanItem, {
                loanId: existingLoan.id,
                bookCopyId: itemDto.bookCopyId.trim(),
                status: targetStatus,
                returnedDate: targetReturnedDate,
              });
              await manager.save(LoanItem, newItem);

              if (targetStatus === LoanItemStatus.BORROWED) {
                copy.status = BookCopyStatus.BORROWED;
                await manager.save(BookCopy, copy);
                if (copy.bookId) {
                  await manager.decrement(Book, { id: copy.bookId }, 'availableCopies', 1);
                }
              }
            }
          }

          // Kiểm tra nếu tất cả LoanItem đều có trạng thái RETURNED thì tự động chuyển Loan sang RETURNED
          const allSavedItems = await manager.find(LoanItem, {
            where: { loanId: existingLoan.id },
          });
          const allReturned =
            allSavedItems.length > 0 &&
            allSavedItems.every((i) => i.status === LoanItemStatus.RETURNED);

          if (allReturned) {
            existingLoan.status = LoanStatus.RETURNED;
            if (!existingLoan.returnDate) {
              existingLoan.returnDate = new Date();
            }
          }
        }

        await manager.save(Loan, existingLoan);
      });

      const updatedLoan = await this.loanRepo.findById(id);
      return this.loanMapper.toDetailResponse(updatedLoan!);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error(`Lỗi khi cập nhật phiếu mượn: ${(error as Error).message}`);
      throw AppException.internal(
        'Đã có lỗi hệ thống xảy ra khi cập nhật phiếu mượn sách',
        { error: (error as Error).message },
        'UPDATE_LOAN_FAILED',
      );
    }
  }

  /**
   * Xóa cứng phiếu mượn cùng toàn bộ loanItem và fine liên quan
   */
  async deleteLoan(id: string): Promise<void> {
    const loan = await this.loanRepo.findById(id);
    if (!loan) {
      throw AppException.notFound(
        `Không tìm thấy phiếu mượn với ID: ${id}`,
        { id },
        'LOAN_NOT_FOUND',
      );
    }

    try {
      await this.loanRepo.runInTransaction(async (manager) => {
        // 1. Phục hồi trạng thái AVAILABLE cho các bản sao sách đang BORROWED hoặc RESERVED
        if (loan.loanItems && loan.loanItems.length > 0) {
          for (const item of loan.loanItems) {
            if (item.status === LoanItemStatus.BORROWED && item.bookCopy) {
              const copy = item.bookCopy;
              if (
                copy.status === BookCopyStatus.BORROWED ||
                copy.status === BookCopyStatus.RESERVED
              ) {
                copy.status = BookCopyStatus.AVAILABLE;
                await manager.save(BookCopy, copy);
                if (copy.bookId) {
                  await manager.increment(Book, { id: copy.bookId }, 'availableCopies', 1);
                }
              }
            }
          }
        }

        // 2. Xóa cứng toàn bộ tiền phạt (fines) liên quan tới phiếu mượn
        await manager.delete(Fine, { loanId: id });

        // 3. Xóa cứng toàn bộ các mục mượn (loanItems) liên quan
        await manager.delete(LoanItem, { loanId: id });

        // 4. Xóa cứng chính phiếu mượn (loan)
        await manager.delete(Loan, { id });
      });
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error(`Lỗi khi xóa cứng phiếu mượn: ${(error as Error).message}`);
      throw AppException.internal(
        'Đã có lỗi hệ thống xảy ra khi xóa phiếu mượn sách',
        { error: (error as Error).message },
        'DELETE_LOAN_FAILED',
      );
    }
  }

  /**
   * Đặt mượn giữ chỗ sách cho độc giả (Borrower Reserve Book)
   * 1. Kiểm tra tài khoản, trần số sách (tối đa 3 sách PENDING + BORROWED), nợ phạt và quá hạn.
   * 2. Khóa phân tán trên Redis (SET NX PX) để chống mượn trùng cuốn cùng 1 thời điểm.
   * 3. Tạo phiếu PENDING, khóa tồn kho tạm (RESERVED) và gán thời hạn lấy 48 giờ.
   */
  async reserveBooks(userId: string, dto: ReserveBookDto): Promise<LoanDetailResponse> {
    if (!userId || !userId.trim()) {
      throw AppException.badRequest(
        'Mã định danh người dùng không hợp lệ',
        { userId },
        'USER_ID_REQUIRED',
      );
    }

    // 1. Kiểm tra tài khoản người dùng
    const user = await this.loanRepo.findUserById(userId.trim());
    if (!user) {
      throw AppException.notFound(
        `Không tìm thấy người dùng với ID: ${userId}`,
        { userId },
        'USER_NOT_FOUND',
      );
    }

    if (user.status === UserStatus.LOCKED) {
      throw AppException.forbidden(
        'Tài khoản của bạn đang bị khóa. Không thể thực hiện đặt mượn sách.',
        { userId, status: user.status },
        'USER_ACCOUNT_LOCKED',
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw AppException.forbidden(
        'Tài khoản của bạn hiện không hoạt động. Không thể thực hiện đặt mượn sách.',
        { userId, status: user.status },
        'USER_ACCOUNT_INACTIVE',
      );
    }

    // 2. Kiểm tra sách quá hạn (OVERDUE)
    const hasOverdue = await this.loanRepo.hasOverdueLoansByUser(user.id);
    if (hasOverdue) {
      throw AppException.badRequest(
        'Hệ thống chặn đặt mượn: Bạn đang có sách quá hạn chưa trả. Vui lòng hoàn trả trước khi đặt mượn mới.',
        { userId },
        'USER_HAS_OVERDUE_LOANS',
      );
    }

    // 3. Kiểm tra tiền phạt chưa đóng (UNPAID fines)
    const hasUnpaidFines = await this.loanRepo.hasUnpaidFinesByUser(user.id);
    if (hasUnpaidFines) {
      throw AppException.badRequest(
        'Hệ thống chặn đặt mượn: Bạn còn khoản tiền phạt chưa thanh toán. Vui lòng thanh toán tiền phạt trước khi đặt mượn.',
        { userId },
        'USER_HAS_UNPAID_FINES',
      );
    }

    // 4. Kiểm tra danh sách bản sao sách gửi lên
    if (!dto.bookCopyIds || !Array.isArray(dto.bookCopyIds) || dto.bookCopyIds.length === 0) {
      throw AppException.badRequest(
        'Danh sách bản sao sách đặt mượn (bookCopyIds) không được để trống',
        { bookCopyIds: dto.bookCopyIds },
        'BOOK_COPIES_REQUIRED',
      );
    }

    const copyIds = dto.bookCopyIds.map((id) => id?.trim()).filter(Boolean);
    if (copyIds.length !== dto.bookCopyIds.length) {
      throw AppException.badRequest(
        'Danh sách bản sao sách chứa ID không hợp lệ',
        { bookCopyIds: dto.bookCopyIds },
        'INVALID_BOOK_COPY_ID',
      );
    }

    const duplicates = copyIds.filter((id, index) => copyIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      throw AppException.badRequest(
        'Danh sách đặt mượn chứa bản sao sách trùng lặp',
        { duplicates: [...new Set(duplicates)] },
        'DUPLICATE_BOOK_COPIES',
      );
    }

    // 5. Kiểm tra trần số sách tối đa theo cấu hình (bao gồm cả PENDING và BORROWED)
    const maxBorrowBooks = await this.getMaxBorrowBooks();
    const currentActiveCount = await this.loanRepo.countActiveBorrowedBooksByUser(user.id);
    if (currentActiveCount + copyIds.length > maxBorrowBooks) {
      throw AppException.badRequest(
        `Bạn đã chạm trần số sách tối đa (tối đa ${maxBorrowBooks} cuốn bao gồm cả sách đang PENDING và BORROWED). Hiện tại bạn đang có ${currentActiveCount} cuốn và yêu cầu thêm ${copyIds.length} cuốn.`,
        { currentActiveCount, requestingCount: copyIds.length, maxAllowed: maxBorrowBooks },
        'MAX_BORROW_LIMIT_EXCEEDED',
      );
    }

    // 6. Khóa phân tán trên Redis cho từng cuốn sách (SET NX PX)
    const acquiredLocks: { key: string; token: string }[] = [];
    try {
      if (this.redisService) {
        for (const copyId of copyIds) {
          const lockKey = `lock:book-copy:${copyId}`;
          const token = await this.redisService.acquireLock(lockKey, 15000);
          if (!token) {
            throw AppException.conflict(
              'Bản sao sách đang được người dùng khác giữ chỗ hoặc mượn. Vui lòng thử lại sau giây lát.',
              { bookCopyId: copyId },
              'BOOK_COPY_LOCKED',
            );
          }
          acquiredLocks.push({ key: lockKey, token });
        }
      }

      // 7. Kiểm tra tính khả dụng của từng bản sao sách
      const bookCopies = await this.loanRepo.findBookCopiesByIds(copyIds);
      if (bookCopies.length !== copyIds.length) {
        const foundIds = new Set(bookCopies.map((c) => c.id));
        const missingIds = copyIds.filter((id) => !foundIds.has(id));
        throw AppException.notFound(
          'Một hoặc nhiều bản sao sách không tồn tại trong hệ thống',
          { missingIds },
          'BOOK_COPY_NOT_FOUND',
        );
      }

      for (const copy of bookCopies) {
        if (copy.status !== BookCopyStatus.AVAILABLE) {
          throw AppException.conflict(
            `Bản sao sách mã '${copy.barcode}' hiện không khả dụng (trạng thái hiện tại: ${copy.status})`,
            { bookCopyId: copy.id, barcode: copy.barcode, status: copy.status },
            'BOOK_COPY_NOT_AVAILABLE',
          );
        }
        if (copy.book && copy.book.availableCopies <= 0) {
          throw AppException.conflict(
            `Đầu sách '${copy.book.title}' hiện đã hết số lượng khả dụng trong thư viện`,
            { bookId: copy.bookId, title: copy.book.title },
            'BOOK_OUT_OF_STOCK',
          );
        }
      }

      // 8. Đặt mượn và khóa tồn kho tạm trong Transaction:
      // Tạo loan ở trạng thái PENDING, giữ chỗ ngay lập tức (RESERVED), gán hạn tới lấy theo cấu hình
      const reservationExpirationHours = await this.getReservationExpirationHours();
      const now = new Date();
      const pickupDeadline = new Date(
        now.getTime() + reservationExpirationHours * 60 * 60 * 1000,
      );

      const savedLoan = await this.loanRepo.runInTransaction(async (manager) => {
        const loan = manager.create(Loan, {
          userId: user.id,
          loanDate: now,
          dueDate: pickupDeadline,
          pickupDeadline,
          status: LoanStatus.PENDING,
          notes: dto.notes?.trim() || null,
        });

        const createdLoan = await manager.save(Loan, loan);

        const loanItems: LoanItem[] = [];
        for (const copy of bookCopies) {
          const loanItem = manager.create(LoanItem, {
            loanId: createdLoan.id,
            bookCopyId: copy.id,
            status: LoanItemStatus.BORROWED,
          });
          loanItems.push(loanItem);

          // Khóa tồn kho tạm thời: RESERVED và giảm số lượng khả dụng
          copy.status = BookCopyStatus.RESERVED;
          await manager.save(BookCopy, copy);

          if (copy.bookId) {
            await manager.decrement(Book, { id: copy.bookId }, 'availableCopies', 1);
          }
        }

        await manager.save(LoanItem, loanItems);
        return createdLoan;
      });

      // Lưu giữ chỗ trên Redis (TTL theo cấu hình RESERVATION_EXPIRATION_HOURS)
      if (this.redisService) {
        await this.redisService.set(
          `reservation:loan:${savedLoan.id}`,
          user.id,
          Math.round(reservationExpirationHours * 3600),
        );
      }

      const fullLoan = await this.loanRepo.findById(savedLoan.id);
      return this.loanMapper.toDetailResponse(fullLoan!);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error(`Lỗi khi đặt mượn giữ chỗ sách: ${(error as Error).message}`);
      throw AppException.internal(
        'Đã có lỗi hệ thống xảy ra khi đặt mượn giữ chỗ sách',
        { error: (error as Error).message },
        'RESERVE_BOOKS_FAILED',
      );
    } finally {
      // Luôn giải phóng khóa phân tán khi hoàn tất hoặc gặp lỗi
      if (this.redisService && acquiredLocks.length > 0) {
        for (const lock of acquiredLocks) {
          await this.redisService.releaseLock(lock.key, lock.token);
        }
      }
    }
  }

  /**
   * Giao sách tại quầy (Fulfill Loan):
   * Thủ thư đối chiếu, chọn đúng bản sao vật lý (nếu quản lý mã vạch) và xác nhận giao sách.
   * Phiếu chuyển từ PENDING → BORROWED, lúc này mới bắt đầu tính ngày mượn và hạn trả.
   */
  async fulfillLoan(loanId: string, dto?: FulfillLoanDto): Promise<LoanDetailResponse> {
    const existingLoan = await this.loanRepo.findById(loanId);
    if (!existingLoan) {
      throw AppException.notFound(
        `Không tìm thấy phiếu mượn với ID: ${loanId}`,
        { loanId },
        'LOAN_NOT_FOUND',
      );
    }

    if (existingLoan.status !== LoanStatus.PENDING) {
      throw AppException.badRequest(
        `Chỉ có thể giao sách cho phiếu mượn ở trạng thái PENDING. Trạng thái hiện tại: ${existingLoan.status}`,
        { loanId, currentStatus: existingLoan.status },
        'INVALID_LOAN_STATUS',
      );
    }

    const now = new Date();
    const deadline = existingLoan.pickupDeadline || existingLoan.dueDate;
    if (deadline && now > new Date(deadline)) {
      const reservationExpirationHours = await this.getReservationExpirationHours();
      throw AppException.badRequest(
        `Phiếu mượn đã quá hạn lấy sách (${reservationExpirationHours} giờ). Vui lòng hủy phiếu hoặc đặt lại.`,
        { loanId, pickupDeadline: deadline },
        'LOAN_PICKUP_EXPIRED',
      );
    }

    // Kiểm tra hạn trả sách (dueDate) bắt buộc khi giao sách tại quầy
    if (!dto?.dueDate) {
      throw AppException.badRequest(
        'Hạn trả sách (dueDate) là bắt buộc khi giao sách tại quầy',
        { field: 'dueDate' },
        'DUE_DATE_REQUIRED',
      );
    }

    const dueDate = new Date(dto.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw AppException.badRequest(
        'Hạn trả sách (dueDate) không hợp lệ',
        { dueDate: dto.dueDate },
        'INVALID_DUE_DATE',
      );
    }

    if (dueDate <= now) {
      throw AppException.badRequest(
        'Hạn trả sách phải sau ngày mượn',
        { now, dueDate },
        'DUE_DATE_MUST_BE_AFTER_LOAN_DATE',
      );
    }

    try {
      await this.loanRepo.runInTransaction(async (manager) => {
        // Đối chiếu mã vạch nếu thủ thư quét mã vạch bản sao vật lý tại quầy
        if (dto?.barcodes && dto.barcodes.length > 0) {
          const physicalCopies = await this.loanRepo.findBookCopiesByBarcodes(dto.barcodes);
          if (physicalCopies.length !== dto.barcodes.length) {
            const foundBarcodes = new Set(physicalCopies.map((c) => c.barcode));
            const missingBarcodes = dto.barcodes.filter((b) => !foundBarcodes.has(b));
            throw AppException.notFound(
              'Một hoặc nhiều mã vạch bản sao sách không tồn tại',
              { missingBarcodes },
              'BOOK_COPY_BARCODE_NOT_FOUND',
            );
          }

          const currentItems = existingLoan.loanItems ?? [];
          for (let i = 0; i < currentItems.length && i < physicalCopies.length; i++) {
            const item = currentItems[i];
            const newCopy = physicalCopies[i];
            if (item.bookCopyId !== newCopy.id) {
              const oldCopy = item.bookCopy;
              if (oldCopy && oldCopy.status === BookCopyStatus.RESERVED) {
                oldCopy.status = BookCopyStatus.AVAILABLE;
                await manager.save(BookCopy, oldCopy);
              }
              item.bookCopyId = newCopy.id;
            }
          }
        }

        // Chuyển trạng thái phiếu: PENDING → BORROWED và tính ngày mượn, hạn trả
        existingLoan.status = LoanStatus.BORROWED;
        existingLoan.loanDate = now;
        existingLoan.dueDate = dueDate;

        if (dto?.notes) {
          existingLoan.notes = dto.notes.trim();
        }

        await manager.save(Loan, existingLoan);

        // Cập nhật các bản sao sách và LoanItem sang BORROWED
        if (existingLoan.loanItems) {
          for (const item of existingLoan.loanItems) {
            item.status = LoanItemStatus.BORROWED;
            await manager.save(LoanItem, item);

            const copy = await manager.findOne(BookCopy, {
              where: { id: item.bookCopyId },
            });
            if (copy) {
              copy.status = BookCopyStatus.BORROWED;
              await manager.save(BookCopy, copy);
            }
          }
        }
      });

      if (this.redisService) {
        await this.redisService.del(`reservation:loan:${loanId}`);
      }

      const fullLoan = await this.loanRepo.findById(loanId);
      return this.loanMapper.toDetailResponse(fullLoan!);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error(`Lỗi khi xác nhận giao sách tại quầy: ${(error as Error).message}`);
      throw AppException.internal(
        'Đã có lỗi hệ thống xảy ra khi xác nhận giao sách tại quầy',
        { error: (error as Error).message },
        'FULFILL_LOAN_FAILED',
      );
    }
  }

  /**
   * Tự động hủy nếu không đến lấy: Quét các phiếu PENDING đã quá hạn 48 giờ lấy sách
   * để chuyển sang EXPIRED và tự động hoàn lại số lượng khả dụng vào kho.
   */
  async cancelExpiredReservations(): Promise<{ cancelledCount: number; loanIds: string[] }> {
    const now = new Date();
    const expiredLoans = await this.loanRepo.findExpiredPendingLoans(now);

    if (!expiredLoans || expiredLoans.length === 0) {
      return { cancelledCount: 0, loanIds: [] };
    }

    this.logger.log(`Phát hiện ${expiredLoans.length} phiếu mượn PENDING quá hạn lấy sách. Đang tiến hành hủy...`);
    const cancelledLoanIds: string[] = [];

    try {
      await this.loanRepo.runInTransaction(async (manager) => {
        for (const loan of expiredLoans) {
          loan.status = LoanStatus.EXPIRED;
          await manager.save(Loan, loan);

          if (loan.loanItems) {
            for (const item of loan.loanItems) {
              const copy = item.bookCopy;
              if (copy && copy.status === BookCopyStatus.RESERVED) {
                copy.status = BookCopyStatus.AVAILABLE;
                await manager.save(BookCopy, copy);

                if (copy.bookId) {
                  await manager.increment(Book, { id: copy.bookId }, 'availableCopies', 1);
                }
              }
            }
          }

          cancelledLoanIds.push(loan.id);
        }
      });

      if (this.redisService) {
        for (const id of cancelledLoanIds) {
          await this.redisService.del(`reservation:loan:${id}`);
        }
      }

      this.logger.log(
        `Đã tự động chuyển ${cancelledLoanIds.length} phiếu mượn sang EXPIRED và hoàn trả tồn kho thành công.`,
      );
      return { cancelledCount: cancelledLoanIds.length, loanIds: cancelledLoanIds };
    } catch (error) {
      this.logger.error(`Lỗi khi tự động hủy phiếu mượn quá hạn: ${(error as Error).message}`);
      throw AppException.internal(
        'Lỗi hệ thống khi hủy các phiếu mượn quá hạn lấy sách',
        { error: (error as Error).message },
        'CANCEL_EXPIRED_RESERVATIONS_FAILED',
      );
    }
  }

  /**
   * Hủy phiếu đặt mượn PENDING chủ động (độc giả hoặc thủ thư hủy trước khi hết hạn)
   */
  async cancelReservation(loanId: string, currentUserId?: string): Promise<LoanDetailResponse> {
    const loan = await this.loanRepo.findById(loanId);
    if (!loan) {
      throw AppException.notFound(
        `Không tìm thấy phiếu mượn với ID: ${loanId}`,
        { loanId },
        'LOAN_NOT_FOUND',
      );
    }

    if (loan.status !== LoanStatus.PENDING) {
      throw AppException.badRequest(
        `Chỉ có thể hủy phiếu đặt mượn khi đang ở trạng thái PENDING. Trạng thái hiện tại: ${loan.status}`,
        { loanId, status: loan.status },
        'CANNOT_CANCEL_NON_PENDING_LOAN',
      );
    }

    if (currentUserId && loan.userId !== currentUserId) {
      throw AppException.forbidden(
        'Bạn không có quyền hủy phiếu đặt mượn của người khác',
        { loanId, currentUserId },
        'FORBIDDEN',
      );
    }

    try {
      await this.loanRepo.runInTransaction(async (manager) => {
        loan.status = LoanStatus.CANCELLED;
        await manager.save(Loan, loan);

        if (loan.loanItems) {
          for (const item of loan.loanItems) {
            const copy = item.bookCopy;
            if (copy && copy.status === BookCopyStatus.RESERVED) {
              copy.status = BookCopyStatus.AVAILABLE;
              await manager.save(BookCopy, copy);

              if (copy.bookId) {
                await manager.increment(Book, { id: copy.bookId }, 'availableCopies', 1);
              }
            }
          }
        }
      });

      if (this.redisService) {
        await this.redisService.del(`reservation:loan:${loanId}`);
      }

      const updated = await this.loanRepo.findById(loanId);
      return this.loanMapper.toDetailResponse(updated!);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error(`Lỗi khi hủy phiếu đặt mượn: ${(error as Error).message}`);
      throw AppException.internal(
        'Đã có lỗi hệ thống xảy ra khi hủy phiếu đặt mượn',
        { error: (error as Error).message },
        'CANCEL_RESERVATION_FAILED',
      );
    }
  }

  /**
   * Tự động quét các phiếu mượn đang BORROWED đã vượt quá hạn chót 23:59:59 của dueDate:
   * - Chuyển trạng thái phiếu mượn sang OVERDUE
   * - Tạo các khoản phạt (Fine) tương ứng với từng bản sao sách (BookCopy) chưa trả
   */
  async processOverdueLoans(
    now: Date = new Date(),
  ): Promise<{ overdueCount: number; fineCount: number; loanIds: string[] }> {
    const overdueLoans = await this.loanRepo.findOverdueBorrowedLoans(now);

    if (!overdueLoans || overdueLoans.length === 0) {
      return { overdueCount: 0, fineCount: 0, loanIds: [] };
    }

    const overdueEntries = overdueLoans
      .map((loan) => {
        const dueDeadline = new Date(loan.dueDate);
        dueDeadline.setHours(23, 59, 59, 0);
        return { loan, dueDeadline };
      })
      .filter(({ dueDeadline }) => dueDeadline < now);

    if (overdueEntries.length === 0) {
      return { overdueCount: 0, fineCount: 0, loanIds: [] };
    }

    const finePerDay = await this.getOverdueFinePerDay();
    const msPerDay = 1000 * 60 * 60 * 24;

    this.logger.log(
      `Phát hiện ${overdueEntries.length} phiếu mượn BORROWED quá hạn trả sách. Đang chuyển sang OVERDUE và tạo khoản phạt...`,
    );

    const overdueLoanIds: string[] = [];
    let totalFinesCreated = 0;

    try {
      await this.loanRepo.runInTransaction(async (manager) => {
        const finesToSave: Fine[] = [];

        for (const { loan, dueDeadline } of overdueEntries) {
          loan.status = LoanStatus.OVERDUE;
          await manager.save(Loan, loan);

          const overdueDays = Math.max(
            1,
            Math.ceil((now.getTime() - dueDeadline.getTime()) / msPerDay),
          );
          const fineAmount = overdueDays * finePerDay;

          const unreturnedItems = (loan.loanItems ?? []).filter(
            (item) => item.status === LoanItemStatus.BORROWED,
          );

          for (const item of unreturnedItems) {
            const bookTitle = item.bookCopy?.book?.title;
            const barcode = item.bookCopy?.barcode;
            const copyLabel = bookTitle
              ? `"${bookTitle}"${barcode ? ` (${barcode})` : ''}`
              : barcode
                ? `mã bản sao ${barcode}`
                : `bản sao ${item.bookCopyId}`;

            const fine = manager.create(Fine, {
              userId: loan.userId,
              loanId: loan.id,
              amount: fineAmount,
              reason: `Phạt quá hạn trả sách ${copyLabel} (${overdueDays} ngày quá hạn)`,
              status: FineStatus.UNPAID,
            });
            finesToSave.push(fine);
          }

          overdueLoanIds.push(loan.id);
        }

        if (finesToSave.length > 0) {
          await manager.save(Fine, finesToSave);
          totalFinesCreated = finesToSave.length;
        }
      });

      this.logger.log(
        `Đã chuyển ${overdueLoanIds.length} phiếu mượn sang OVERDUE và tạo ${totalFinesCreated} khoản phạt thành công.`,
      );
      return {
        overdueCount: overdueLoanIds.length,
        fineCount: totalFinesCreated,
        loanIds: overdueLoanIds,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xử lý phiếu mượn quá hạn trả: ${(error as Error).message}`);
      throw AppException.internal(
        'Lỗi hệ thống khi xử lý các phiếu mượn quá hạn trả sách',
        { error: (error as Error).message },
        'PROCESS_OVERDUE_LOANS_FAILED',
      );
    }
  }

  /**
   * Tự động quét các phiếu mượn đang BORROWED và gửi email nhắc nhở trả sách cho người dùng:
   * - Hạn chót 23:59:59 của dueDate được làm tròn thành 00:00:00 ngày hôm sau.
   * - Thời điểm gửi nhắc nhở = (00:00:00 ngày hôm sau của dueDate) - OVERDUE_REMINDER_BEFORE_DAYS ngày (luôn rơi vào 00:00:00).
   * - Khi cronjob chạy vào 00:00 mỗi ngày, lọc các phiếu có thời điểm gửi trùng 00:00:00 ngày hôm nay.
   * - Chỉ lấy các LoanItem có trạng thái BORROWED để đưa thông tin sách vào email.
   */
  async sendDueDateReminderEmails(
    now: Date = new Date(),
  ): Promise<{ remindedCount: number; failedCount: number; loanIds: string[] }> {
    if (!this.mailService) {
      this.logger.warn(
        'MailService chưa được cấu hình, bỏ qua tác vụ gửi email nhắc nhở trả sách.',
      );
      return { remindedCount: 0, failedCount: 0, loanIds: [] };
    }

    const reminderBeforeDays = await this.getOverdueReminderBeforeDays();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const windowStart = new Date(startOfToday);
    windowStart.setDate(windowStart.getDate() + reminderBeforeDays - 1);

    const windowEnd = new Date(startOfToday);
    windowEnd.setDate(windowEnd.getDate() + reminderBeforeDays + 1);

    const candidateLoans = await this.loanRepo.findBorrowedLoansForReminder(
      windowStart,
      windowEnd,
    );

    if (!candidateLoans || candidateLoans.length === 0) {
      return { remindedCount: 0, failedCount: 0, loanIds: [] };
    }

    const matchingLoans = candidateLoans.filter((loan) => {
      // Hạn chót 23:59:59 của dueDate làm tròn thành 00:00:00 ngày hôm sau
      const roundedDueDeadline = new Date(loan.dueDate);
      roundedDueDeadline.setHours(0, 0, 0, 0);
      roundedDueDeadline.setDate(roundedDueDeadline.getDate() + 1);

      const reminderTime = new Date(roundedDueDeadline);
      reminderTime.setDate(reminderTime.getDate() - reminderBeforeDays);

      return reminderTime.getTime() === startOfToday.getTime();
    });

    if (matchingLoans.length === 0) {
      return { remindedCount: 0, failedCount: 0, loanIds: [] };
    }

    this.logger.log(
      `Phát hiện ${matchingLoans.length} phiếu mượn BORROWED cần gửi email nhắc nhở trả sách (trước hạn ${reminderBeforeDays} ngày).`,
    );

    const remindedLoanIds: string[] = [];
    let failedCount = 0;

    for (const loan of matchingLoans) {
      const borrowedItems = (loan.loanItems ?? []).filter(
        (item) => item.status === LoanItemStatus.BORROWED,
      );

      if (borrowedItems.length === 0) {
        continue;
      }

      const recipientEmail = loan.user?.email?.trim();
      if (!recipientEmail) {
        this.logger.warn(
          `Bỏ qua gửi email nhắc nhở cho phiếu mượn ${loan.id} do người dùng không có địa chỉ email.`,
        );
        continue;
      }

      const books: OverdueReminderBookItem[] = borrowedItems.map((item) => ({
        title: item.bookCopy?.book?.title ?? `Sách (${item.bookCopyId})`,
        barcode: item.bookCopy?.barcode ?? null,
        isbn: item.bookCopy?.book?.isbn ?? null,
        authorName: item.bookCopy?.book?.author?.name ?? null,
      }));

      try {
        await this.mailService.sendOverdueReminderEmail({
          to: recipientEmail,
          recipientName: loan.user?.fullName || loan.user?.username || null,
          loanId: loan.id,
          dueDate: new Date(loan.dueDate),
          reminderBeforeDays,
          books,
        });
        remindedLoanIds.push(loan.id);
      } catch (error: any) {
        failedCount++;
        this.logger.error(
          `Gửi email nhắc nhở thất bại cho phiếu mượn ${loan.id} (${recipientEmail}): ${error?.message ?? error}`,
        );
      }
    }

    return {
      remindedCount: remindedLoanIds.length,
      failedCount,
      loanIds: remindedLoanIds,
    };
  }
}

