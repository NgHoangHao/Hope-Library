import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMapper, type Mapper } from '@automapper/core';
import { classes } from '@automapper/classes';
import { LoanService } from './loan.service.js';
import { LoanRepository } from '../repository/loan.repository.js';
import { LoanProfile } from '../mapper/loan.mapper.js';
import { AppException } from '../common/index.js';
import { Loan, LoanStatus } from '../model/loan/loan.entity.js';
import { LoanItem, LoanItemStatus } from '../model/loan-item/loan-item.entity.js';
import { Fine, FineStatus } from '../model/fine/fine.entity.js';
import { BookCopy, BookCopyStatus } from '../model/book-copy/book-copy.entity.js';
import { Book } from '../model/book/book.entity.js';
import { User, UserStatus } from '../model/user/user.entity.js';
import { RedisService } from '../utils/redis.service.js';
import { MailService } from '../utils/mail.service.js';
import { SystemConfigService } from './system-config.service.js';
import { ConfigService } from '@nestjs/config';

describe('LoanService', () => {
  let service: LoanService;
  let mapper: Mapper;
  let loanRepo: Partial<Record<keyof LoanRepository, ReturnType<typeof vi.fn>>>;
  let redisService: Partial<Record<keyof RedisService, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    mapper = createMapper({ strategyInitializer: classes() });
    const loanMapper = new LoanProfile(mapper);

    loanRepo = {
      findLoans: vi.fn(),
      findById: vi.fn(),
      findUserById: vi.fn(),
      findBookCopiesByIds: vi.fn(),
      findBookCopiesByBarcodes: vi.fn(),
      countActiveBorrowedBooksByUser: vi.fn(),
      hasOverdueLoansByUser: vi.fn(),
      hasUnpaidFinesByUser: vi.fn(),
      findExpiredPendingLoans: vi.fn(),
      findOverdueBorrowedLoans: vi.fn(),
      findBorrowedLoansForReminder: vi.fn(),
      runInTransaction: vi.fn(),
    };

    redisService = {
      acquireLock: vi.fn().mockResolvedValue('mock-token-123'),
      releaseLock: vi.fn().mockResolvedValue(true),
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
    };

    service = new LoanService(
      loanRepo as unknown as LoanRepository,
      loanMapper,
      redisService as unknown as RedisService,
    );
  });

  describe('getAllLoans (Phân trang)', () => {
    it('nên lấy danh sách phiếu mượn có phân trang', async () => {
      const mockLoans = [
        new Loan({
          id: 'loan-1',
          userId: 'user-1',
          loanDate: new Date(),
          dueDate: new Date(Date.now() + 86400000 * 7),
          status: LoanStatus.BORROWED,
        }),
      ];
      loanRepo.findLoans!.mockResolvedValue([mockLoans, 1]);

      const result = await service.getAllLoans({ page: 1, size: 10 });

      expect(loanRepo.findLoans).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        userId: undefined,
        status: undefined,
        search: undefined,
      });
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('loan-1');
    });
  });

  describe('createLoan (Tạo phiếu mượn kèm list LoanItem)', () => {
    it('nên ném lỗi nếu userId rỗng', async () => {
      await expect(
        service.createLoan({
          userId: '',
          items: [{ bookCopyId: 'copy-1' }],
        }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném lỗi nếu không tìm thấy người dùng', async () => {
      loanRepo.findUserById!.mockResolvedValue(null);

      await expect(
        service.createLoan({
          userId: 'invalid-user',
          items: [{ bookCopyId: 'copy-1' }],
        }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném lỗi nếu danh sách items rỗng', async () => {
      loanRepo.findUserById!.mockResolvedValue({ id: 'user-1' } as any);

      await expect(
        service.createLoan({
          userId: 'user-1',
          items: [],
        }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném lỗi nếu items có bản sao trùng lặp', async () => {
      loanRepo.findUserById!.mockResolvedValue({ id: 'user-1' } as any);

      await expect(
        service.createLoan({
          userId: 'user-1',
          items: [{ bookCopyId: 'copy-1' }, { bookCopyId: 'copy-1' }],
        }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném lỗi nếu bản sao sách không ở trạng thái AVAILABLE', async () => {
      loanRepo.findUserById!.mockResolvedValue({ id: 'user-1' } as any);
      loanRepo.findBookCopiesByIds!.mockResolvedValue([
        { id: 'copy-1', barcode: 'BC001', status: BookCopyStatus.BORROWED },
      ] as any);

      await expect(
        service.createLoan({
          userId: 'user-1',
          items: [{ bookCopyId: 'copy-1' }],
        }),
      ).rejects.toThrow(AppException);
    });

    it('nên tạo phiếu mượn thành công và tự động tính dueDate theo MAX_LOAN_DAYS', async () => {
      loanRepo.findUserById!.mockResolvedValue({ id: 'user-1' } as any);
      const mockCopy = {
        id: 'copy-1',
        bookId: 'book-1',
        barcode: 'BC001',
        status: BookCopyStatus.AVAILABLE,
      };
      loanRepo.findBookCopiesByIds!.mockResolvedValue([mockCopy] as any);

      const mockManager = {
        create: vi.fn((entityClass, data) => ({ ...data, id: 'gen-uuid' })),
        save: vi.fn(async (entityClass, data) => data),
        decrement: vi.fn(),
      };

      loanRepo.runInTransaction!.mockImplementation(async (cb) => {
        return cb(mockManager as any);
      });

      const baseLoanDate = new Date('2026-11-01T00:00:00.000Z');
      const expectedDueDate = new Date(baseLoanDate);
      expectedDueDate.setDate(expectedDueDate.getDate() + 14);

      const fullLoan = new Loan({
        id: 'loan-created-1',
        userId: 'user-1',
        loanDate: baseLoanDate,
        dueDate: expectedDueDate,
        status: LoanStatus.BORROWED,
        loanItems: [
          new LoanItem({
            id: 'item-1',
            loanId: 'loan-created-1',
            bookCopyId: 'copy-1',
            status: LoanItemStatus.BORROWED,
          }),
        ],
      });
      loanRepo.findById!.mockResolvedValue(fullLoan);

      const result = await service.createLoan({
        userId: 'user-1',
        loanDate: baseLoanDate,
        items: [{ bookCopyId: 'copy-1' }],
      });

      expect(loanRepo.runInTransaction).toHaveBeenCalled();
      expect(mockManager.create).toHaveBeenCalledWith(
        Loan,
        expect.objectContaining({
          userId: 'user-1',
          loanDate: baseLoanDate,
          dueDate: expectedDueDate,
        }),
      );
      expect(redisService.acquireLock).toHaveBeenCalledWith('lock:book-copy:copy-1', 15000);
      expect(redisService.releaseLock).toHaveBeenCalled();
      expect(mockManager.decrement).toHaveBeenCalled();
      expect(result.id).toBe('loan-created-1');
      expect(result.items).toHaveLength(1);
    });

    it('nên ném lỗi nếu không lấy được khóa phân tán Redis (sách đang được độc giả khác giữ chỗ)', async () => {
      loanRepo.findUserById!.mockResolvedValue({ id: 'user-1' } as any);
      redisService.acquireLock!.mockResolvedValue(null); // Không lấy được lock

      await expect(
        service.createLoan({
          userId: 'user-1',
          items: [{ bookCopyId: 'copy-1' }],
        }),
      ).rejects.toThrow(AppException);
    });
  });

  describe('updateLoan (Cập nhật phiếu mượn và danh sách LoanItem)', () => {
    it('nên ném lỗi nếu truyền trực tiếp status của loan', async () => {
      await expect(
        service.updateLoan('loan-1', { status: LoanStatus.RETURNED } as any),
      ).rejects.toMatchObject({
        errorCode: 'LOAN_STATUS_DIRECT_UPDATE_NOT_ALLOWED',
      });
      expect(loanRepo.findById).not.toHaveBeenCalled();
    });

    it('nên ném lỗi nếu không tìm thấy phiếu mượn', async () => {
      loanRepo.findById!.mockResolvedValue(null);

      await expect(service.updateLoan('not-found', {})).rejects.toThrow(AppException);
    });

    it('nên tự động chuyển status loan sang RETURNED khi tất cả LoanItem có status là RETURNED', async () => {
      const existingLoan = new Loan({
        id: 'loan-1',
        userId: 'user-1',
        loanDate: new Date(),
        dueDate: new Date(Date.now() + 86400000 * 7),
        status: LoanStatus.BORROWED,
        loanItems: [
          new LoanItem({
            id: 'item-1',
            loanId: 'loan-1',
            bookCopyId: 'copy-1',
            status: LoanItemStatus.BORROWED,
          }),
        ],
      });

      const mockManager = {
        find: vi.fn().mockImplementation(async (entityClass) => {
          if (entityClass === BookCopy) {
            return [
              {
                id: 'copy-1',
                bookId: 'book-1',
                barcode: 'BC001',
                status: BookCopyStatus.BORROWED,
              },
            ];
          }
          if (entityClass === LoanItem) {
            return [
              new LoanItem({
                id: 'item-1',
                loanId: 'loan-1',
                bookCopyId: 'copy-1',
                status: LoanItemStatus.RETURNED,
              }),
            ];
          }
          return [];
        }),
        save: vi.fn(async (entityClass, data) => data),
        increment: vi.fn(),
        decrement: vi.fn(),
        delete: vi.fn(),
        create: vi.fn((cls, data) => data),
      };

      loanRepo.runInTransaction!.mockImplementation(async (cb) => {
        return cb(mockManager as any);
      });

      const updatedLoan = new Loan({
        ...existingLoan,
        status: LoanStatus.RETURNED,
        loanItems: [
          new LoanItem({
            id: 'item-1',
            loanId: 'loan-1',
            bookCopyId: 'copy-1',
            status: LoanItemStatus.RETURNED,
          }),
        ],
      });
      loanRepo.findById!.mockResolvedValueOnce(existingLoan).mockResolvedValueOnce(updatedLoan);

      const result = await service.updateLoan('loan-1', {
        items: [
          {
            id: 'item-1',
            bookCopyId: 'copy-1',
            status: LoanItemStatus.RETURNED,
          },
        ],
      });

      expect(loanRepo.runInTransaction).toHaveBeenCalled();
      expect(existingLoan.status).toBe(LoanStatus.RETURNED);
      expect(existingLoan.returnDate).toBeInstanceOf(Date);
      expect(result.id).toBe('loan-1');
      expect(result.status).toBe(LoanStatus.RETURNED);
    });

    it('không nên tự động chuyển status loan sang RETURNED nếu vẫn còn LoanItem chưa RETURNED', async () => {
      const existingLoan = new Loan({
        id: 'loan-2',
        userId: 'user-1',
        loanDate: new Date(),
        dueDate: new Date(Date.now() + 86400000 * 7),
        status: LoanStatus.BORROWED,
        loanItems: [
          new LoanItem({
            id: 'item-1',
            loanId: 'loan-2',
            bookCopyId: 'copy-1',
            status: LoanItemStatus.BORROWED,
          }),
          new LoanItem({
            id: 'item-2',
            loanId: 'loan-2',
            bookCopyId: 'copy-2',
            status: LoanItemStatus.BORROWED,
          }),
        ],
      });

      const mockManager = {
        find: vi.fn().mockImplementation(async (entityClass) => {
          if (entityClass === BookCopy) {
            return [
              { id: 'copy-1', bookId: 'book-1', barcode: 'BC001', status: BookCopyStatus.BORROWED },
              { id: 'copy-2', bookId: 'book-2', barcode: 'BC002', status: BookCopyStatus.BORROWED },
            ];
          }
          if (entityClass === LoanItem) {
            return [
              new LoanItem({
                id: 'item-1',
                loanId: 'loan-2',
                bookCopyId: 'copy-1',
                status: LoanItemStatus.RETURNED,
              }),
              new LoanItem({
                id: 'item-2',
                loanId: 'loan-2',
                bookCopyId: 'copy-2',
                status: LoanItemStatus.BORROWED,
              }),
            ];
          }
          return [];
        }),
        save: vi.fn(async (entityClass, data) => data),
        increment: vi.fn(),
        decrement: vi.fn(),
        delete: vi.fn(),
        create: vi.fn((cls, data) => data),
      };

      loanRepo.runInTransaction!.mockImplementation(async (cb) => {
        return cb(mockManager as any);
      });

      loanRepo.findById!.mockResolvedValueOnce(existingLoan).mockResolvedValueOnce(existingLoan);

      const result = await service.updateLoan('loan-2', {
        items: [
          { id: 'item-1', bookCopyId: 'copy-1', status: LoanItemStatus.RETURNED },
          { id: 'item-2', bookCopyId: 'copy-2', status: LoanItemStatus.BORROWED },
        ],
      });

      expect(existingLoan.status).toBe(LoanStatus.BORROWED);
      expect(result.status).toBe(LoanStatus.BORROWED);
    });
  });

  describe('deleteLoan (Xóa cứng loan, loanItem và fine liên quan)', () => {
    it('nên ném lỗi nếu không tìm thấy phiếu mượn cần xóa', async () => {
      loanRepo.findById!.mockResolvedValue(null);

      await expect(service.deleteLoan('not-found')).rejects.toThrow(AppException);
    });

    it('nên phục hồi bản sao và xóa cứng loan, loanItem, fines trong transaction', async () => {
      const loanToDelete = new Loan({
        id: 'loan-del-1',
        userId: 'user-1',
        loanDate: new Date(),
        dueDate: new Date(),
        loanItems: [
          new LoanItem({
            id: 'item-del-1',
            loanId: 'loan-del-1',
            bookCopyId: 'copy-1',
            status: LoanItemStatus.BORROWED,
            bookCopy: new BookCopy({
              id: 'copy-1',
              bookId: 'book-1',
              status: BookCopyStatus.BORROWED,
            }),
          }),
        ],
      });
      loanRepo.findById!.mockResolvedValue(loanToDelete);

      const mockManager = {
        save: vi.fn(),
        increment: vi.fn(),
        delete: vi.fn(),
      };

      loanRepo.runInTransaction!.mockImplementation(async (cb) => {
        return cb(mockManager as any);
      });

      await service.deleteLoan('loan-del-1');

      expect(loanRepo.runInTransaction).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled();
      expect(mockManager.increment).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'book-1' },
        'availableCopies',
        1,
      );
      expect(mockManager.delete).toHaveBeenCalledTimes(3); // Fine, LoanItem, Loan
    });
  });

  describe('reserveBooks (Đặt mượn giữ chỗ sách cho độc giả)', () => {
    it('nên ném lỗi nếu tài khoản người dùng bị khóa (LOCKED)', async () => {
      loanRepo.findUserById!.mockResolvedValue(
        new User({ id: 'user-1', status: UserStatus.LOCKED }),
      );

      await expect(
        service.reserveBooks('user-1', { bookCopyIds: ['copy-1'] }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném lỗi nếu người dùng đang có sách quá hạn (OVERDUE)', async () => {
      loanRepo.findUserById!.mockResolvedValue(
        new User({ id: 'user-1', status: UserStatus.ACTIVE }),
      );
      loanRepo.hasOverdueLoansByUser!.mockResolvedValue(true);

      await expect(
        service.reserveBooks('user-1', { bookCopyIds: ['copy-1'] }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném lỗi nếu người dùng còn nợ tiền phạt chưa thanh toán (UNPAID)', async () => {
      loanRepo.findUserById!.mockResolvedValue(
        new User({ id: 'user-1', status: UserStatus.ACTIVE }),
      );
      loanRepo.hasOverdueLoansByUser!.mockResolvedValue(false);
      loanRepo.hasUnpaidFinesByUser!.mockResolvedValue(true);

      await expect(
        service.reserveBooks('user-1', { bookCopyIds: ['copy-1'] }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném lỗi nếu người dùng đã chạm trần mượn tối đa 3 sách (PENDING + BORROWED)', async () => {
      loanRepo.findUserById!.mockResolvedValue(
        new User({ id: 'user-1', status: UserStatus.ACTIVE }),
      );
      loanRepo.hasOverdueLoansByUser!.mockResolvedValue(false);
      loanRepo.hasUnpaidFinesByUser!.mockResolvedValue(false);
      // Đã có 2 cuốn, muốn mượn thêm 2 cuốn -> 4 > 3
      loanRepo.countActiveBorrowedBooksByUser!.mockResolvedValue(2);

      await expect(
        service.reserveBooks('user-1', { bookCopyIds: ['copy-1', 'copy-2'] }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném lỗi nếu không lấy được khóa phân tán Redis (sách đang bị người khác thao tác)', async () => {
      loanRepo.findUserById!.mockResolvedValue(
        new User({ id: 'user-1', status: UserStatus.ACTIVE }),
      );
      loanRepo.hasOverdueLoansByUser!.mockResolvedValue(false);
      loanRepo.hasUnpaidFinesByUser!.mockResolvedValue(false);
      loanRepo.countActiveBorrowedBooksByUser!.mockResolvedValue(0);

      redisService.acquireLock!.mockResolvedValue(null); // lock thất bại

      await expect(
        service.reserveBooks('user-1', { bookCopyIds: ['copy-1'] }),
      ).rejects.toThrow(AppException);
    });

    it('nên đặt mượn thành công: tạo loan PENDING, gán thời hạn 48 giờ, copy sang RESERVED và giảm kho', async () => {
      loanRepo.findUserById!.mockResolvedValue(
        new User({ id: 'user-1', status: UserStatus.ACTIVE }),
      );
      loanRepo.hasOverdueLoansByUser!.mockResolvedValue(false);
      loanRepo.hasUnpaidFinesByUser!.mockResolvedValue(false);
      loanRepo.countActiveBorrowedBooksByUser!.mockResolvedValue(1);

      const mockBook = new Book({ id: 'book-1', title: 'Sách hay', availableCopies: 5 });
      const mockCopy = new BookCopy({
        id: 'copy-1',
        barcode: 'BC001',
        status: BookCopyStatus.AVAILABLE,
        bookId: 'book-1',
        book: mockBook,
      });

      loanRepo.findBookCopiesByIds!.mockResolvedValue([mockCopy]);

      const mockCreatedLoan = new Loan({
        id: 'loan-res-1',
        userId: 'user-1',
        status: LoanStatus.PENDING,
        loanDate: new Date(),
        dueDate: new Date(Date.now() + 48 * 3600 * 1000),
        pickupDeadline: new Date(Date.now() + 48 * 3600 * 1000),
      });

      const mockManager = {
        create: vi.fn().mockImplementation((entityClass, data) => {
          if (entityClass === Loan) return { ...mockCreatedLoan, ...data };
          return data;
        }),
        save: vi.fn().mockImplementation((entityClass, entity) => {
          if (entityClass === Loan) return mockCreatedLoan;
          return entity;
        }),
        decrement: vi.fn().mockResolvedValue(undefined),
      };

      loanRepo.runInTransaction!.mockImplementation(async (cb) => {
        return cb(mockManager as any);
      });

      loanRepo.findById!.mockResolvedValue(mockCreatedLoan);

      const result = await service.reserveBooks('user-1', {
        bookCopyIds: ['copy-1'],
        notes: 'Ghi chú đặt sách',
      });

      expect(redisService.acquireLock).toHaveBeenCalled();
      expect(mockCopy.status).toBe(BookCopyStatus.RESERVED);
      expect(mockManager.decrement).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'book-1' },
        'availableCopies',
        1,
      );
      expect(redisService.set).toHaveBeenCalledWith(
        'reservation:loan:loan-res-1',
        'user-1',
        48 * 3600,
      );
      expect(redisService.releaseLock).toHaveBeenCalled();
      expect(result.id).toBe('loan-res-1');
      expect(result.status).toBe(LoanStatus.PENDING);
    });
  });

  describe('fulfillLoan (Giao sách tại quầy)', () => {
    it('nên ném lỗi nếu phiếu mượn không tồn tại', async () => {
      loanRepo.findById!.mockResolvedValue(null);

      await expect(service.fulfillLoan('invalid-id')).rejects.toThrow(AppException);
    });

    it('nên ném lỗi nếu phiếu mượn không ở trạng thái PENDING', async () => {
      loanRepo.findById!.mockResolvedValue(
        new Loan({ id: 'loan-1', status: LoanStatus.BORROWED }),
      );

      await expect(service.fulfillLoan('loan-1')).rejects.toThrow(AppException);
    });

    it('nên ném lỗi nếu phiếu mượn PENDING đã quá hạn 48 giờ lấy sách', async () => {
      const pastDate = new Date(Date.now() - 3600 * 1000); // 1 giờ trước
      loanRepo.findById!.mockResolvedValue(
        new Loan({
          id: 'loan-1',
          status: LoanStatus.PENDING,
          pickupDeadline: pastDate,
        }),
      );

      await expect(service.fulfillLoan('loan-1')).rejects.toThrow(AppException);
    });

    it('nên xác nhận giao sách thành công: chuyển PENDING -> BORROWED và tự động tính dueDate theo MAX_LOAN_DAYS', async () => {
      const futureDate = new Date(Date.now() + 24 * 3600 * 1000);
      const mockCopy = new BookCopy({
        id: 'copy-1',
        barcode: 'BC001',
        status: BookCopyStatus.RESERVED,
      });
      const mockItem = new LoanItem({
        id: 'item-1',
        bookCopyId: 'copy-1',
        bookCopy: mockCopy,
        status: LoanItemStatus.BORROWED,
      });
      const mockPendingLoan = new Loan({
        id: 'loan-1',
        status: LoanStatus.PENDING,
        pickupDeadline: futureDate,
        loanItems: [mockItem],
      });

      loanRepo.findById!.mockResolvedValue(mockPendingLoan);

      const mockManager = {
        save: vi.fn(),
        findOne: vi.fn().mockResolvedValue(mockCopy),
      };

      loanRepo.runInTransaction!.mockImplementation(async (cb) => {
        return cb(mockManager as any);
      });

      const result = await service.fulfillLoan('loan-1', {
        notes: 'Giao tại quầy',
      });

      expect(mockPendingLoan.status).toBe(LoanStatus.BORROWED);
      const expectedDueDate = new Date(mockPendingLoan.loanDate);
      expectedDueDate.setDate(expectedDueDate.getDate() + 14);
      expect(mockPendingLoan.dueDate).toEqual(expectedDueDate);
      expect(mockCopy.status).toBe(BookCopyStatus.BORROWED);
      expect(redisService.del).toHaveBeenCalledWith('reservation:loan:loan-1');
      expect(result.status).toBe(LoanStatus.BORROWED);
    });
  });

  describe('cancelExpiredReservations (Tự động hủy nếu không đến lấy)', () => {
    it('nên quét các phiếu PENDING quá hạn, chuyển sang EXPIRED và hoàn trả tồn kho', async () => {
      const mockBook = new Book({ id: 'book-1', availableCopies: 2 });
      const mockCopy = new BookCopy({
        id: 'copy-1',
        status: BookCopyStatus.RESERVED,
        bookId: 'book-1',
        book: mockBook,
      });
      const mockItem = new LoanItem({
        id: 'item-1',
        bookCopyId: 'copy-1',
        bookCopy: mockCopy,
      });
      const mockExpiredLoan = new Loan({
        id: 'expired-loan-1',
        status: LoanStatus.PENDING,
        loanItems: [mockItem],
      });

      loanRepo.findExpiredPendingLoans!.mockResolvedValue([mockExpiredLoan]);

      const mockManager = {
        save: vi.fn(),
        increment: vi.fn().mockResolvedValue(undefined),
      };

      loanRepo.runInTransaction!.mockImplementation(async (cb) => {
        return cb(mockManager as any);
      });

      const res = await service.cancelExpiredReservations();

      expect(res.cancelledCount).toBe(1);
      expect(res.loanIds).toContain('expired-loan-1');
      expect(mockExpiredLoan.status).toBe(LoanStatus.EXPIRED);
      expect(mockCopy.status).toBe(BookCopyStatus.AVAILABLE);
      expect(mockManager.increment).toHaveBeenCalledWith(
        expect.anything(),
        { id: 'book-1' },
        'availableCopies',
        1,
      );
    });
  });

  describe('cancelReservation (Hủy chủ động phiếu PENDING)', () => {
    it('nên hủy phiếu PENDING thành công và phục hồi trạng thái bản sao sách', async () => {
      const mockCopy = new BookCopy({
        id: 'copy-1',
        status: BookCopyStatus.RESERVED,
        bookId: 'book-1',
      });
      const mockItem = new LoanItem({
        id: 'item-1',
        bookCopyId: 'copy-1',
        bookCopy: mockCopy,
      });
      const mockLoan = new Loan({
        id: 'loan-cancel-1',
        userId: 'user-1',
        status: LoanStatus.PENDING,
        loanItems: [mockItem],
      });

      loanRepo.findById!.mockResolvedValue(mockLoan);

      const mockManager = {
        save: vi.fn(),
        increment: vi.fn(),
      };

      loanRepo.runInTransaction!.mockImplementation(async (cb) => {
        return cb(mockManager as any);
      });

      const result = await service.cancelReservation('loan-cancel-1', 'user-1');

      expect(mockLoan.status).toBe(LoanStatus.CANCELLED);
      expect(mockCopy.status).toBe(BookCopyStatus.AVAILABLE);
      expect(result.status).toBe(LoanStatus.CANCELLED);
    });
  });

  describe('processOverdueLoans (Cron job quét phiếu BORROWED quá hạn trả)', () => {
    it('nên trả về 0 nếu không có phiếu mượn BORROWED nào quá hạn', async () => {
      loanRepo.findOverdueBorrowedLoans!.mockResolvedValue([]);

      const result = await service.processOverdueLoans(new Date('2026-11-20T00:05:00.000Z'));

      expect(result).toEqual({ overdueCount: 0, fineCount: 0, loanIds: [] });
      expect(loanRepo.runInTransaction).not.toHaveBeenCalled();
    });

    it('không chuyển sang OVERDUE nếu vẫn trong ngày dueDate (chưa qua 23:59:59)', async () => {
      const sameDayAfternoon = new Date(2026, 10, 20, 18, 0, 0);
      const dueDateMorning = new Date(2026, 10, 20, 9, 0, 0);

      const mockLoan = new Loan({
        id: 'loan-same-day',
        userId: 'user-1',
        dueDate: dueDateMorning,
        status: LoanStatus.BORROWED,
        loanItems: [],
      });

      loanRepo.findOverdueBorrowedLoans!.mockResolvedValue([mockLoan]);

      const result = await service.processOverdueLoans(sameDayAfternoon);

      expect(result).toEqual({ overdueCount: 0, fineCount: 0, loanIds: [] });
      expect(mockLoan.status).toBe(LoanStatus.BORROWED);
      expect(loanRepo.runInTransaction).not.toHaveBeenCalled();
    });

    it('nên chuyển BORROWED sang OVERDUE và chỉ tạo Fine cho các bookCopy chưa trả', async () => {
      const now = new Date('2026-11-20T00:05:00.000Z');
      const twoDaysAgo = new Date('2026-11-18T00:05:00.000Z');

      const unreturnedCopy1 = new BookCopy({
        id: 'copy-1',
        barcode: 'BC-001',
        book: new Book({ id: 'book-1', title: 'Clean Code' }),
      });
      const returnedCopy2 = new BookCopy({
        id: 'copy-2',
        barcode: 'BC-002',
        book: new Book({ id: 'book-2', title: 'Refactoring' }),
      });
      const unreturnedCopy3 = new BookCopy({
        id: 'copy-3',
        barcode: 'BC-003',
        book: new Book({ id: 'book-3', title: 'DDIA' }),
      });

      const item1 = new LoanItem({
        id: 'item-1',
        loanId: 'loan-overdue-1',
        bookCopyId: 'copy-1',
        status: LoanItemStatus.BORROWED,
        bookCopy: unreturnedCopy1,
      });
      const item2 = new LoanItem({
        id: 'item-2',
        loanId: 'loan-overdue-1',
        bookCopyId: 'copy-2',
        status: LoanItemStatus.RETURNED,
        returnedDate: new Date('2026-11-17T10:00:00.000Z'),
        bookCopy: returnedCopy2,
      });
      const item3 = new LoanItem({
        id: 'item-3',
        loanId: 'loan-overdue-1',
        bookCopyId: 'copy-3',
        status: LoanItemStatus.BORROWED,
        bookCopy: unreturnedCopy3,
      });

      const mockOverdueLoan = new Loan({
        id: 'loan-overdue-1',
        userId: 'user-1',
        dueDate: twoDaysAgo,
        status: LoanStatus.BORROWED,
        loanItems: [item1, item2, item3],
      });

      loanRepo.findOverdueBorrowedLoans!.mockResolvedValue([mockOverdueLoan]);

      const savedFines: Fine[] = [];
      const mockManager = {
        create: vi.fn((_entity, data) => new Fine(data)),
        save: vi.fn(async (entity, payload) => {
          if (entity === Fine && Array.isArray(payload)) {
            savedFines.push(...payload);
          }
          return payload;
        }),
      };

      loanRepo.runInTransaction!.mockImplementation(async (cb) => cb(mockManager as any));

      const result = await service.processOverdueLoans(now);

      expect(result).toEqual({
        overdueCount: 1,
        fineCount: 2,
        loanIds: ['loan-overdue-1'],
      });
      expect(mockOverdueLoan.status).toBe(LoanStatus.OVERDUE);
      expect(savedFines).toHaveLength(2);
      expect(savedFines[0]).toMatchObject({
        userId: 'user-1',
        loanId: 'loan-overdue-1',
        amount: 10000,
        status: FineStatus.UNPAID,
      });
      expect(savedFines[0].reason).toContain('Clean Code');
      expect(savedFines[0].reason).toContain('BC-001');
      expect(savedFines[1].reason).toContain('DDIA');
      expect(savedFines[1].reason).toContain('BC-003');
    });
  });

  describe('sendDueDateReminderEmails (Cron job 00:00 nhắc nhở sắp đến hạn trả sách)', () => {
    it('nên gửi email với các LoanItem đang BORROWED khi 00:00 ngày hôm sau của dueDate trừ OVERDUE_REMINDER_BEFORE_DAYS trùng 00:00 hôm nay', async () => {
      const mockConfigService = {
        get: vi.fn((_key: string, defaultVal?: string) => defaultVal ?? '1'),
      };
      const mockSystemConfigService = {
        getValue: vi.fn().mockResolvedValue('2'), // 2 ngày từ Redis/DB
      };
      const mockMailService = {
        sendOverdueReminderEmail: vi.fn().mockResolvedValue(undefined),
      };

      const loanMapper = new LoanProfile(mapper);
      const reminderService = new LoanService(
        loanRepo as unknown as LoanRepository,
        loanMapper,
        redisService as unknown as RedisService,
        mockConfigService as unknown as ConfigService,
        mockSystemConfigService as unknown as SystemConfigService,
        mockMailService as unknown as MailService,
      );

      // Cron chạy 00:00 ngày 20/11/2026
      // Với OVERDUE_REMINDER_BEFORE_DAYS = 2:
      // - loan-match có dueDate = 21/11/2026 -> làm tròn 00:00 22/11/2026 -> trừ 2 ngày = 00:00 20/11/2026 (KHỚP)
      // - loan-other có dueDate = 22/11/2026 -> làm tròn 00:00 23/11/2026 -> trừ 2 ngày = 00:00 21/11/2026 (KHÔNG KHỚP)
      const now = new Date(2026, 10, 20, 0, 0, 0);

      const user = new User({
        id: 'user-1',
        email: 'reader@example.com',
        fullName: 'Nguyen Van A',
        username: 'nguyenvana',
      });

      const borrowedItem = new LoanItem({
        id: 'item-1',
        loanId: 'loan-match',
        bookCopyId: 'copy-1',
        status: LoanItemStatus.BORROWED,
        bookCopy: new BookCopy({
          id: 'copy-1',
          barcode: 'BC-101',
          book: new Book({
            id: 'book-1',
            title: 'Clean Architecture',
            isbn: '978-0134494166',
          }),
        }),
      });

      const returnedItem = new LoanItem({
        id: 'item-2',
        loanId: 'loan-match',
        bookCopyId: 'copy-2',
        status: LoanItemStatus.RETURNED,
        bookCopy: new BookCopy({
          id: 'copy-2',
          barcode: 'BC-102',
          book: new Book({ id: 'book-2', title: 'Domain-Driven Design' }),
        }),
      });

      const matchingLoan = new Loan({
        id: 'loan-match',
        userId: 'user-1',
        user,
        dueDate: new Date(2026, 10, 21, 15, 30, 0),
        status: LoanStatus.BORROWED,
        loanItems: [borrowedItem, returnedItem],
      });

      const nonMatchingLoan = new Loan({
        id: 'loan-other',
        userId: 'user-1',
        user,
        dueDate: new Date(2026, 10, 22, 10, 0, 0),
        status: LoanStatus.BORROWED,
        loanItems: [borrowedItem],
      });

      loanRepo.findBorrowedLoansForReminder!.mockResolvedValue([
        matchingLoan,
        nonMatchingLoan,
      ]);

      const result = await reminderService.sendDueDateReminderEmails(now);

      expect(result).toEqual({
        remindedCount: 1,
        failedCount: 0,
        loanIds: ['loan-match'],
      });
      expect(mockSystemConfigService.getValue).toHaveBeenCalledWith(
        'OVERDUE_REMINDER_BEFORE_DAYS',
      );
      expect(mockMailService.sendOverdueReminderEmail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendOverdueReminderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'reader@example.com',
          recipientName: 'Nguyen Van A',
          loanId: 'loan-match',
          reminderBeforeDays: 2,
          books: [
            expect.objectContaining({
              title: 'Clean Architecture',
              barcode: 'BC-101',
              isbn: '978-0134494166',
            }),
          ],
        }),
      );
    });

    it('nên fallback sang biến môi trường OVERDUE_REMINDER_BEFORE_DAYS = 1 khi Redis và DB đều trả về null', async () => {
      const mockConfigService = {
        get: vi.fn((key: string, defaultVal?: string) =>
          key === 'OVERDUE_REMINDER_BEFORE_DAYS' ? '1' : defaultVal,
        ),
      };
      const mockSystemConfigService = {
        getValue: vi.fn().mockResolvedValue(undefined),
      };
      const mockMailService = {
        sendOverdueReminderEmail: vi.fn().mockResolvedValue(undefined),
      };

      const loanMapper = new LoanProfile(mapper);
      const reminderService = new LoanService(
        loanRepo as unknown as LoanRepository,
        loanMapper,
        redisService as unknown as RedisService,
        mockConfigService as unknown as ConfigService,
        mockSystemConfigService as unknown as SystemConfigService,
        mockMailService as unknown as MailService,
      );

      // Cron chạy 00:00 ngày 20/11/2026
      // Fallback 1 ngày -> dueDate = 20/11/2026 (làm tròn 00:00 21/11/2026 trừ 1 ngày = 00:00 20/11/2026)
      const now = new Date(2026, 10, 20, 0, 0, 0);

      const loanDueToday = new Loan({
        id: 'loan-env-fallback',
        userId: 'user-2',
        user: new User({ id: 'user-2', email: 'u2@example.com', fullName: 'User 2' }),
        dueDate: new Date(2026, 10, 20, 10, 0, 0),
        status: LoanStatus.BORROWED,
        loanItems: [
          new LoanItem({
            id: 'item-3',
            loanId: 'loan-env-fallback',
            bookCopyId: 'copy-3',
            status: LoanItemStatus.BORROWED,
            bookCopy: new BookCopy({
              id: 'copy-3',
              barcode: 'BC-201',
              book: new Book({ id: 'book-3', title: 'Refactoring' }),
            }),
          }),
        ],
      });

      loanRepo.findBorrowedLoansForReminder!.mockResolvedValue([loanDueToday]);

      const result = await reminderService.sendDueDateReminderEmails(now);

      expect(result).toEqual({
        remindedCount: 1,
        failedCount: 0,
        loanIds: ['loan-env-fallback'],
      });
      expect(mockMailService.sendOverdueReminderEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'u2@example.com',
          reminderBeforeDays: 1,
        }),
      );
    });
  });
});

