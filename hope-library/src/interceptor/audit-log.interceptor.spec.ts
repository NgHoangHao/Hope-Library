import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { AuditLogInterceptor } from './audit-log.interceptor.js';
import { AuditLogService } from '../service/audit-log.service.js';

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;
  let auditLogService: Partial<Record<keyof AuditLogService, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    auditLogService = {
      logAsync: vi.fn(),
    };
    interceptor = new AuditLogInterceptor(auditLogService as unknown as AuditLogService);
  });

  it('nên ghi log khi có request CRUD hợp lệ', async () => {
    const mockRequest = {
      method: 'POST',
      originalUrl: '/api/books',
      headers: {
        'user-agent': 'JestClient',
      },
      params: {},
      query: {},
      body: { title: 'Book 1', password: 'secret-password' },
    };
    const mockResponse = {
      statusCode: 201,
    };

    const mockContext = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    };

    const mockNext = {
      handle: () => of({ success: true }),
    };

    const observable = interceptor.intercept(mockContext as any, mockNext as any);
    await new Promise((resolve) => observable.subscribe({ next: resolve }));

    expect(auditLogService.logAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'POST',
        targetResource: '/api/books',
        userAgent: 'JestClient',
        details: expect.objectContaining({
          statusCode: 201,
          body: { title: 'Book 1', password: '***' }, // Sensitive data masked
        }),
      }),
    );
  });

  it('nên bỏ qua không ghi log đối với method GET', async () => {
    const mockRequest = {
      method: 'GET',
      originalUrl: '/api/books',
      headers: {},
    };
    const mockContext = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({ statusCode: 200 }),
      }),
    };
    const mockNext = {
      handle: () => of({ success: true }),
    };

    const observable = interceptor.intercept(mockContext as any, mockNext as any);
    await new Promise((resolve) => observable.subscribe({ next: resolve }));

    expect(auditLogService.logAsync).not.toHaveBeenCalled();
  });

  it('nên bỏ qua không ghi log đối với endpoint /audit-logs để tránh vòng lặp', async () => {
    const mockRequest = {
      method: 'POST',
      originalUrl: '/audit-logs',
      headers: {},
    };
    const mockContext = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({ statusCode: 200 }),
      }),
    };
    const mockNext = {
      handle: () => of({ success: true }),
    };

    const observable = interceptor.intercept(mockContext as any, mockNext as any);
    await new Promise((resolve) => observable.subscribe({ next: resolve }));

    expect(auditLogService.logAsync).not.toHaveBeenCalled();
  });
});

