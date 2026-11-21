import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service.js';
import { AppException } from '../common/index.js';

describe('MailService (Brevo HTTP API)', () => {
  let service: MailService;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    const envMap: Record<string, string> = {
      BREVO_API_KEY: 'xkeysib-test-api-key',
      MAIL_FROM: '3bro.sup.service@gmail.com',
      MAIL_FROM_NAME: 'Hope Library',
      OTP_EXPIRATION_MINUTES: '5',
    };

    const mockConfigService = {
      get: vi.fn((key: string, defaultValue?: string) => envMap[key] ?? defaultValue),
    } as unknown as ConfigService;

    service = new MailService(mockConfigService);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sendOtpEmail nên gửi POST tới Brevo API với api-key và nội dung OTP', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messageId: '<brevo-otp-123>' }),
    });
    globalThis.fetch = fetchMock as any;

    await service.sendOtpEmail('reader@example.com', '654321');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.method).toBe('POST');
    expect(init.headers['api-key']).toBe('xkeysib-test-api-key');

    const body = JSON.parse(init.body);
    expect(body.sender).toEqual({
      name: 'Hope Library',
      email: '3bro.sup.service@gmail.com',
    });
    expect(body.to).toEqual([{ email: 'reader@example.com' }]);
    expect(body.htmlContent).toContain('654321');
  });

  it('sendForgotPasswordOtpEmail nên gửi POST tới Brevo API thành công', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messageId: '<brevo-fp-123>' }),
    });
    globalThis.fetch = fetchMock as any;

    await service.sendForgotPasswordOtpEmail('reader@example.com', '998877');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.subject).toContain('đặt lại mật khẩu');
    expect(body.htmlContent).toContain('998877');
  });

  it('sendOverdueReminderEmail nên gửi kèm tên người nhận và danh sách sách', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messageId: '<brevo-rem-123>' }),
    });
    globalThis.fetch = fetchMock as any;

    await service.sendOverdueReminderEmail({
      to: 'reader@example.com',
      recipientName: 'Nguyen Van A',
      loanId: 'loan-001',
      dueDate: new Date('2026-12-01T00:00:00Z'),
      reminderBeforeDays: 1,
      books: [{ title: 'Clean Code', authorName: 'Robert C. Martin', barcode: 'BC-01' }],
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual([{ email: 'reader@example.com', name: 'Nguyen Van A' }]);
    expect(body.htmlContent).toContain('Clean Code');
    expect(body.htmlContent).toContain('loan-001');
  });

  it('ném AppException khi Brevo API trả về lỗi HTTP', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: vi.fn().mockResolvedValue('{"message":"Key not found"}'),
    });
    globalThis.fetch = fetchMock as any;

    await expect(service.sendOtpEmail('reader@example.com', '123456')).rejects.toThrow(
      AppException,
    );
  });
});
