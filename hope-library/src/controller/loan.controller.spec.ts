import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request } from 'express';
import { LoanController } from './loan.controller.js';
import { LoanService } from '../service/loan.service.js';
import {
  FulfillLoanDto,
  LoanDetailResponse,
  LoanStatus,
  PaginatedLoanResponse,
  ReserveBookDto,
} from '../model/loan/loan.dto.js';
import { TokenHelper } from '../utils/token.helper.js';

describe('LoanController', () => {
  let controller: LoanController;
  let loanService: Partial<Record<keyof LoanService, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    loanService = {
      getAllLoans: vi.fn(),
      getLoanById: vi.fn(),
      createLoan: vi.fn(),
      updateLoan: vi.fn(),
      deleteLoan: vi.fn(),
      reserveBooks: vi.fn(),
      fulfillLoan: vi.fn(),
      cancelExpiredReservations: vi.fn(),
      cancelReservation: vi.fn(),
    };

    controller = new LoanController(loanService as unknown as LoanService);
  });

  describe('getAllLoans', () => {
    it('nên trả về danh sách phiếu mượn bọc trong ApiResponse.success', async () => {
      const mockResult = new PaginatedLoanResponse({
        items: [],
        page: 1,
        size: 10,
        total: 0,
        totalItems: 0,
        totalPages: 0,
      });
      loanService.getAllLoans!.mockResolvedValue(mockResult);

      const res = await controller.getAllLoans({ page: 1, size: 10 });
      expect(res.statusCode).toBe(200);
      expect(res.response).toBe(mockResult);
    });
  });

  describe('getMyLoans (Lấy danh sách phiếu mượn của độc giả từ token)', () => {
    it('nên trích xuất userId từ token, truyền filter status và trả về ApiResponse<PaginatedLoanResponse>', async () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer valid.mocktoken',
        },
      } as unknown as Request;

      vi.spyOn(TokenHelper, 'extractTokenFromRequest').mockReturnValue('valid.mocktoken');
      vi.spyOn(TokenHelper, 'decodeToken').mockReturnValue({
        userId: 'borrower-uuid-1',
        email: 'borrower@example.com',
        roles: ['BORROWER'],
      });

      const mockResult = new PaginatedLoanResponse({
        items: [],
        page: 1,
        size: 10,
        total: 0,
        totalItems: 0,
        totalPages: 0,
      });
      loanService.getAllLoans!.mockResolvedValue(mockResult);

      const res = await controller.getMyLoans(mockReq, 1, 10, LoanStatus.BORROWED, 'search-term');

      expect(loanService.getAllLoans).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        userId: 'borrower-uuid-1',
        status: LoanStatus.BORROWED,
        search: 'search-term',
      });
      expect(res.statusCode).toBe(200);
      expect(res.response).toBe(mockResult);
    });
  });

  describe('getLoanById', () => {
    it('nên trả về chi tiết phiếu mượn', async () => {
      const mockLoan = new LoanDetailResponse({ id: 'loan-1', items: [] });
      loanService.getLoanById!.mockResolvedValue(mockLoan);

      const res = await controller.getLoanById('loan-1');
      expect(res.statusCode).toBe(200);
      expect(res.response.id).toBe('loan-1');
    });
  });

  describe('reserveBooks (Đặt mượn sách cho độc giả với token)', () => {
    it('nên trích xuất userId từ token và gọi service.reserveBooks', async () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer valid.mocktoken',
        },
      } as unknown as Request;

      vi.spyOn(TokenHelper, 'extractTokenFromRequest').mockReturnValue('valid.mocktoken');
      vi.spyOn(TokenHelper, 'decodeToken').mockReturnValue({
        userId: 'borrower-uuid-1',
        email: 'borrower@example.com',
        roles: ['BORROWER'],
      });

      const mockLoan = new LoanDetailResponse({
        id: 'loan-res-1',
        status: LoanStatus.PENDING,
        items: [],
      });
      loanService.reserveBooks!.mockResolvedValue(mockLoan);

      const dto: ReserveBookDto = {
        bookCopyIds: ['copy-uuid-1'],
        notes: 'Đặt mượn giữ chỗ',
      };

      const res = await controller.reserveBooks(mockReq, dto);

      expect(loanService.reserveBooks).toHaveBeenCalledWith('borrower-uuid-1', dto);
      expect(res.statusCode).toBe(201);
      expect(res.response.status).toBe(LoanStatus.PENDING);
    });
  });

  describe('fulfillLoan (Giao sách tại quầy)', () => {
    it('nên gọi service.fulfillLoan và trả về ApiResponse 200', async () => {
      const mockLoan = new LoanDetailResponse({
        id: 'loan-1',
        status: LoanStatus.BORROWED,
        items: [],
      });
      loanService.fulfillLoan!.mockResolvedValue(mockLoan);

      const dto: FulfillLoanDto = {
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        notes: 'Giao sách tại quầy',
      };

      const res = await controller.fulfillLoan('loan-1', dto);

      expect(loanService.fulfillLoan).toHaveBeenCalledWith('loan-1', dto);
      expect(res.statusCode).toBe(200);
      expect(res.response.status).toBe(LoanStatus.BORROWED);
    });
  });

  describe('cancelExpiredLoans (Quét hủy phiếu mượn quá hạn)', () => {
    it('nên gọi service.cancelExpiredReservations', async () => {
      loanService.cancelExpiredReservations!.mockResolvedValue({
        cancelledCount: 2,
        loanIds: ['loan-1', 'loan-2'],
      });

      const res = await controller.cancelExpiredLoans();

      expect(loanService.cancelExpiredReservations).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
      expect(res.response.cancelledCount).toBe(2);
    });
  });

  describe('cancelReservation (Hủy phiếu đặt mượn)', () => {
    it('nên gọi service.cancelReservation với quyền tương ứng', async () => {
      const mockReq = {
        headers: { authorization: 'Bearer mock.token' },
      } as unknown as Request;

      vi.spyOn(TokenHelper, 'extractTokenFromRequest').mockReturnValue('mock.token');
      vi.spyOn(TokenHelper, 'decodeToken').mockReturnValue({
        userId: 'user-1',
        email: 'u1@example.com',
        roles: ['BORROWER'],
      });

      const mockLoan = new LoanDetailResponse({
        id: 'loan-cancel-1',
        status: LoanStatus.CANCELLED,
        items: [],
      });
      loanService.cancelReservation!.mockResolvedValue(mockLoan);

      const res = await controller.cancelReservation('loan-cancel-1', mockReq);

      expect(loanService.cancelReservation).toHaveBeenCalledWith('loan-cancel-1', 'user-1');
      expect(res.statusCode).toBe(200);
      expect(res.response.status).toBe(LoanStatus.CANCELLED);
    });
  });
});
