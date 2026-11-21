import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AppException } from '../common/index.js';
import { SystemConfigService } from '../service/system-config.service.js';

export interface OverdueReminderBookItem {
  title: string;
  barcode?: string | null;
  isbn?: string | null;
  authorName?: string | null;
}

export interface OverdueReminderEmailPayload {
  to: string;
  recipientName?: string | null;
  loanId: string;
  dueDate: Date;
  reminderBeforeDays: number;
  books: OverdueReminderBookItem[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly mailFrom: string;
  private static readonly OTP_EXPIRATION_CONFIG_KEY = 'OTP_EXPIRATION_MINUTES';

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly systemConfigService?: SystemConfigService,
  ) {
    const host = this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<string>('MAIL_PORT', '465'));
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');
    this.mailFrom = this.configService.get<string>('MAIL_FROM', user || 'noreply@hopelibrary.com');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // SSL cho port 465
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  /**
   * Lấy thời hạn hiệu lực OTP (phút):
   * - Ưu tiên lấy từ SystemConfigService (Redis cache -> DB) theo key `OTP_EXPIRATION_MINUTES`
   * - Nếu null/không tồn tại hoặc lỗi -> fallback sang biến môi trường `OTP_EXPIRATION_MINUTES`
   */
  private async getOtpExpirationMinutes(): Promise<number> {
    const envRaw = this.configService.get<string>(MailService.OTP_EXPIRATION_CONFIG_KEY, '5');
    const envParsed = Number(envRaw);
    const envFallback = Number.isFinite(envParsed) && envParsed > 0 ? envParsed : 5;

    if (!this.systemConfigService) {
      return envFallback;
    }

    try {
      const rawValue = await this.systemConfigService.getValue(
        MailService.OTP_EXPIRATION_CONFIG_KEY,
      );
      if (rawValue === null || rawValue === undefined || rawValue.trim() === '') {
        return envFallback;
      }

      const parsed = Number(rawValue);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : envFallback;
    } catch (error: any) {
      this.logger.warn(
        `Không thể đọc cấu hình ${MailService.OTP_EXPIRATION_CONFIG_KEY} từ SystemConfig, fallback sang env (${envFallback} phút): ${error?.message ?? error}`,
      );
      return envFallback;
    }
  }

  /**
   * Gửi mã OTP xác thực đăng ký tài khoản tới email của người dùng
   * @param to Địa chỉ email người nhận
   * @param otp Mã xác thực OTP gồm 6 chữ số
   */
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const otpExpirationMinutes = await this.getOtpExpirationMinutes();
    const otpExpirationSeconds = Math.round(otpExpirationMinutes * 60);

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Hope Library" <${this.mailFrom}>`,
      to,
      subject: 'Mã xác thực OTP đăng ký tài khoản - Hope Library',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Mã xác thực OTP</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
            .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
            .content { padding: 32px 28px; color: #334155; }
            .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
            .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
            .otp-container { text-align: center; margin: 28px 0; }
            .otp-badge { display: inline-block; background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 16px 36px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; user-select: all; }
            .expire-notice { text-align: center; color: #dc2626; font-size: 14px; font-weight: 600; margin-top: 12px; }
            .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .warning { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HOPE LIBRARY</h1>
              <p>Hệ Thống Quản Lý Thư Viện Hiện Đại</p>
            </div>
            <div class="content">
              <div class="greeting">Xin chào bạn,</div>
              <div class="message">
                Cảm ơn bạn đã lựa chọn đăng ký tài khoản tại <strong>Hope Library</strong>. 
                Dưới đây là mã xác thực OTP của bạn để hoàn tất quá trình kích hoạt tài khoản:
              </div>
              <div class="otp-container">
                <div class="otp-badge">${otp}</div>
                <div class="expire-notice">⏰ Mã OTP này có hiệu lực trong vòng ${otpExpirationMinutes} phút (${otpExpirationSeconds} giây).</div>
              </div>
              <div class="warning">
                Lưu ý: Tuyệt đối không chia sẻ mã xác thực này cho bất kỳ ai để bảo vệ quyền lợi tài khoản. Nếu bạn không thực hiện đăng ký tài khoản tại Hope Library, vui lòng bỏ qua thư này.
              </div>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Hope Library. All rights reserved.<br/>
              Hỗ trợ: 3bro.sup.service@gmail.com
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Gửi email OTP thành công tới ${to}. MessageId: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error(`Lỗi khi gửi email OTP tới ${to}: ${error.message}`, error.stack);
      throw AppException.internal(
        'Không thể gửi mã xác thực OTP qua Gmail. Vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau',
        { email: to, details: error.message },
        'SEND_OTP_MAIL_FAILED',
      );
    }
  }

  /**
   * Gửi mã OTP xác thực đặt lại mật khẩu (quên mật khẩu) tới email của người dùng
   * @param to Địa chỉ email người nhận
   * @param otp Mã xác thực OTP gồm 6 chữ số
   */
  async sendForgotPasswordOtpEmail(to: string, otp: string): Promise<void> {
    const otpExpirationMinutes = await this.getOtpExpirationMinutes();
    const otpExpirationSeconds = Math.round(otpExpirationMinutes * 60);

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Hope Library" <${this.mailFrom}>`,
      to,
      subject: 'Mã xác thực OTP đặt lại mật khẩu - Hope Library',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Mã xác thực đặt lại mật khẩu</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
            .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #3b82f6 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
            .content { padding: 32px 28px; color: #334155; }
            .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
            .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
            .otp-container { text-align: center; margin: 28px 0; }
            .otp-badge { display: inline-block; background-color: #fef2f2; border: 2px dashed #ef4444; border-radius: 12px; padding: 16px 36px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #dc2626; user-select: all; }
            .expire-notice { text-align: center; color: #b91c1c; font-size: 14px; font-weight: 600; margin-top: 12px; }
            .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .warning { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HOPE LIBRARY</h1>
              <p>Yêu Cầu Đặt Lại Mật Khẩu</p>
            </div>
            <div class="content">
              <div class="greeting">Xin chào bạn,</div>
              <div class="message">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>Hope Library</strong> liên kết với địa chỉ email này.
                Dưới đây là mã xác thực OTP của bạn để tiếp tục quá trình:
              </div>
              <div class="otp-container">
                <div class="otp-badge">${otp}</div>
                <div class="expire-notice">⏰ Mã OTP này có hiệu lực trong vòng ${otpExpirationMinutes} phút (${otpExpirationSeconds} giây).</div>
              </div>
              <div class="warning">
                Lưu ý bảo mật: Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu bạn không thực hiện yêu cầu đặt lại mật khẩu, vui lòng bỏ qua thư này hoặc đổi mật khẩu tài khoản ngay để đảm bảo an toàn.
              </div>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Hope Library. All rights reserved.<br/>
              Hỗ trợ: 3bro.sup.service@gmail.com
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Gửi email OTP quên mật khẩu thành công tới ${to}. MessageId: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error(`Lỗi khi gửi email OTP quên mật khẩu tới ${to}: ${error.message}`, error.stack);
      throw AppException.internal(
        'Không thể gửi mã xác thực OTP qua Gmail. Vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau',
        { email: to, details: error.message },
        'SEND_OTP_MAIL_FAILED',
      );
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Gửi email nhắc nhở sắp đến hạn trả sách tới người dùng
   */
  async sendOverdueReminderEmail(payload: OverdueReminderEmailPayload): Promise<void> {
    const { to, recipientName, loanId, dueDate, reminderBeforeDays, books } = payload;

    const dueDeadline = new Date(dueDate);
    dueDeadline.setHours(23, 59, 59, 0);

    const pad = (n: number) => String(n).padStart(2, '0');
    const formattedDueDate = `${pad(dueDeadline.getDate())}/${pad(dueDeadline.getMonth() + 1)}/${dueDeadline.getFullYear()}`;
    const greetingName = recipientName?.trim()
      ? this.escapeHtml(recipientName.trim())
      : 'bạn';

    const bookRowsHtml = books
      .map((book, index) => {
        const title = this.escapeHtml(book.title);
        const author = book.authorName ? this.escapeHtml(book.authorName) : '—';
        const barcode = book.barcode ? this.escapeHtml(book.barcode) : '—';
        const isbn = book.isbn ? this.escapeHtml(book.isbn) : '—';
        return `
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b;">${index + 1}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${title}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #475569;">${author}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-family: monospace;">${barcode}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-family: monospace;">${isbn}</td>
          </tr>
        `;
      })
      .join('');

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Hope Library" <${this.mailFrom}>`,
      to,
      subject: `Nhắc nhở sắp đến hạn trả sách (${formattedDueDate}) - Hope Library`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Nhắc nhở sắp đến hạn trả sách</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
            .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #b45309 0%, #f59e0b 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.95; }
            .content { padding: 28px; color: #334155; }
            .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
            .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
            .deadline-box { background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; color: #92400e; font-size: 14px; line-height: 1.5; }
            .book-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
            .book-table th { background-color: #f1f5f9; color: #334155; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; font-weight: 600; }
            .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
            .note { font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 16px; padding-top: 14px; border-top: 1px solid #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>HOPE LIBRARY</h1>
              <p>Thông Báo Nhắc Nhở Trả Sách Sắp Đến Hạn</p>
            </div>
            <div class="content">
              <div class="greeting">Xin chào ${greetingName},</div>
              <div class="message">
                Đây là thông báo nhắc nhở tự động từ <strong>Hope Library</strong> (gửi trước hạn chót <strong>${reminderBeforeDays} ngày</strong>).
                Phiếu mượn <strong>#${this.escapeHtml(loanId)}</strong> của bạn hiện có <strong>${books.length}</strong> cuốn sách sắp đến hạn trả:
              </div>
              <div class="deadline-box">
                ⏰ <strong>Hạn chót trả sách:</strong> 23:59:59 ngày <strong>${formattedDueDate}</strong>.<br/>
                Vui lòng hoàn trả sách đúng hạn tại thư viện để tránh phát sinh phí phạt quá hạn.
              </div>
              <table class="book-table">
                <thead>
                  <tr>
                    <th style="text-align: center; width: 40px;">#</th>
                    <th>Tên sách</th>
                    <th>Tác giả</th>
                    <th>Mã bản sao</th>
                    <th>ISBN</th>
                  </tr>
                </thead>
                <tbody>
                  ${bookRowsHtml}
                </tbody>
              </table>
              <div class="note">
                Nếu bạn đã hoàn trả các cuốn sách trên, vui lòng bỏ qua email này hoặc liên hệ thủ thư để được kiểm tra và hỗ trợ.
              </div>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Hope Library. All rights reserved.<br/>
              Hỗ trợ: 3bro.sup.service@gmail.com
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Gửi email nhắc nhở trả sách thành công tới ${to} (loanId: ${loanId}). MessageId: ${info.messageId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Lỗi khi gửi email nhắc nhở trả sách tới ${to} (loanId: ${loanId}): ${error.message}`,
        error.stack,
      );
      throw AppException.internal(
        'Không thể gửi email nhắc nhở trả sách qua Gmail',
        { email: to, loanId, details: error.message },
        'SEND_OVERDUE_REMINDER_MAIL_FAILED',
      );
    }
  }
}
