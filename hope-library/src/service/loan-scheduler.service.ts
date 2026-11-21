import { Injectable, Logger, OnApplicationBootstrap, } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoanService } from './loan.service.js';

@Injectable()
export class LoanSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LoanSchedulerService.name);

  constructor(private readonly loanService: LoanService) { }

  /**
   * Tác vụ định kỳ (Scheduled Job):
   * Quét các phiếu mượn PENDING đã quá hạn 48 giờ lấy sách để tự động chuyển sang EXPIRED
   * và hoàn trả lại số lượng bản sao khả dụng vào kho sách.
   * Chạy định kỳ mỗi 5 phút.
   */
  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Server khởi động, bắt đầu kiểm tra phiếu mượn quá hạn...');

    await this.handleOverdueLoans();
  }
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredReservations(): Promise<void> {
    try {
      this.logger.debug('Đang quét các phiếu mượn PENDING quá hạn lấy sách...');
      const result = await this.loanService.cancelExpiredReservations();
      if (result.cancelledCount > 0) {
        this.logger.log(
          `Tác vụ định kỳ đã hủy ${result.cancelledCount} phiếu mượn quá hạn: [${result.loanIds.join(', ')}]`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Lỗi trong tác vụ định kỳ quét phiếu mượn quá hạn: ${error?.message || error}`,
      );
    }
  }

  /**
   * Tác vụ định kỳ (Scheduled Job):
   * Chạy vào 00:05 sáng mỗi ngày để quét các phiếu mượn BORROWED đã quá hạn trả (dueDate < now),
   * tự động chuyển sang OVERDUE và tạo khoản phạt (Fine) tương ứng với từng bản sao sách chưa trả.
   */
  @Cron('5 0 * * *', {
    name: 'process-overdue-loans',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleOverdueLoans(): Promise<void> {
    try {
      this.logger.debug('Đang quét các phiếu mượn BORROWED quá hạn trả sách...');
      const result = await this.loanService.processOverdueLoans();
      if (result.overdueCount > 0) {
        this.logger.log(
          `Tác vụ định kỳ đã chuyển ${result.overdueCount} phiếu mượn sang OVERDUE và tạo ${result.fineCount} khoản phạt: [${result.loanIds.join(', ')}]`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Lỗi trong tác vụ định kỳ xử lý phiếu mượn quá hạn trả: ${error?.message || error}`,
      );
    }
  }

  /**
   * Tác vụ định kỳ (Scheduled Job):
   * Chạy vào 00:00 sáng mỗi ngày để quét các phiếu mượn BORROWED thỏa điều kiện nhắc nhở trả sách
   * (00:00:00 ngày hôm sau của dueDate trừ đi OVERDUE_REMINDER_BEFORE_DAYS ngày)
   * và gửi email thông báo tới người dùng với thông tin các sách đang mượn (LoanItem BORROWED).
   */
  @Cron('0 0 * * *', {
    name: 'send-overdue-reminder-emails',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleOverdueReminderEmails(): Promise<void> {
    try {
      this.logger.debug('Đang quét các phiếu mượn BORROWED để gửi email nhắc nhở trả sách...');
      const result = await this.loanService.sendDueDateReminderEmails();
      if (result.remindedCount > 0 || result.failedCount > 0) {
        this.logger.log(
          `Tác vụ định kỳ nhắc nhở trả sách hoàn tất: thành công ${result.remindedCount}, thất bại ${result.failedCount}, loanIds: [${result.loanIds.join(', ')}]`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Lỗi trong tác vụ định kỳ gửi email nhắc nhở trả sách: ${error?.message || error}`,
      );
    }
  }
}
