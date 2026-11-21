import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoanSchedulerService } from './loan-scheduler.service.js';
import { LoanService } from './loan.service.js';

describe('LoanSchedulerService', () => {
  let scheduler: LoanSchedulerService;
  let loanService: Partial<Record<keyof LoanService, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    loanService = {
      cancelExpiredReservations: vi.fn(),
      processOverdueLoans: vi.fn(),
      sendDueDateReminderEmails: vi.fn(),
    };
    scheduler = new LoanSchedulerService(loanService as unknown as LoanService);
  });

  it('nên gọi loanService.cancelExpiredReservations định kỳ', async () => {
    loanService.cancelExpiredReservations!.mockResolvedValue({
      cancelledCount: 1,
      loanIds: ['loan-1'],
    });

    await scheduler.handleExpiredReservations();

    expect(loanService.cancelExpiredReservations).toHaveBeenCalled();
  });

  it('không văng exception nếu service gặp lỗi khi hủy phiếu giữ chỗ', async () => {
    loanService.cancelExpiredReservations!.mockRejectedValue(new Error('DB connection error'));

    await expect(scheduler.handleExpiredReservations()).resolves.toBeUndefined();
  });

  it('nên gọi loanService.processOverdueLoans vào 00:05 sáng', async () => {
    loanService.processOverdueLoans!.mockResolvedValue({
      overdueCount: 2,
      fineCount: 3,
      loanIds: ['loan-1', 'loan-2'],
    });

    await scheduler.handleOverdueLoans();

    expect(loanService.processOverdueLoans).toHaveBeenCalled();
  });

  it('không văng exception nếu service gặp lỗi khi xử lý phiếu quá hạn', async () => {
    loanService.processOverdueLoans!.mockRejectedValue(new Error('DB timeout'));

    await expect(scheduler.handleOverdueLoans()).resolves.toBeUndefined();
  });

  it('nên gọi loanService.sendDueDateReminderEmails vào 00:00 sáng mỗi ngày', async () => {
    loanService.sendDueDateReminderEmails!.mockResolvedValue({
      remindedCount: 2,
      failedCount: 0,
      loanIds: ['loan-1', 'loan-2'],
    });

    await scheduler.handleOverdueReminderEmails();

    expect(loanService.sendDueDateReminderEmails).toHaveBeenCalled();
  });

  it('không văng exception nếu service gặp lỗi khi gửi email nhắc nhở trả sách', async () => {
    loanService.sendDueDateReminderEmails!.mockRejectedValue(new Error('SMTP error'));

    await expect(scheduler.handleOverdueReminderEmails()).resolves.toBeUndefined();
  });
});
