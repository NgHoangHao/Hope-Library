import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMapper, type Mapper } from '@automapper/core';
import { classes } from '@automapper/classes';
import { AuditLogService } from './audit-log.service.js';
import { AuditLogRepository } from '../repository/audit-log.repository.js';
import { AuditLogProfile } from '../mapper/audit-log.mapper.js';
import { AppException } from '../common/index.js';
import { AuditLog } from '../model/audit-log/audit-log.entity.js';
import { User } from '../model/user/user.entity.js';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let mapper: Mapper;
  let auditLogRepo: Partial<Record<keyof AuditLogRepository, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    mapper = createMapper({ strategyInitializer: classes() });
    const auditLogMapper = new AuditLogProfile(mapper);

    auditLogRepo = {
      findAuditLogs: vi.fn(),
      findById: vi.fn(),
      createAndSave: vi.fn(),
      save: vi.fn(),
    };

    service = new AuditLogService(
      auditLogRepo as unknown as AuditLogRepository,
      auditLogMapper,
    );
  });

  describe('log (Tạo bản ghi audit log)', () => {
    it('nên tạo log thành công khi dữ liệu hợp lệ', async () => {
      const mockLog = new AuditLog({
        id: 'log-1',
        userId: 'user-1',
        action: 'POST',
        targetResource: '/api/books',
        details: { statusCode: 201 },
        ipAddress: '127.0.0.1',
        userAgent: 'PostmanRuntime',
      });
      auditLogRepo.createAndSave!.mockResolvedValue(mockLog);

      const result = await service.log({
        userId: 'user-1',
        action: 'POST',
        targetResource: '/api/books',
        details: { statusCode: 201 },
        ipAddress: '127.0.0.1',
        userAgent: 'PostmanRuntime',
      });

      expect(auditLogRepo.createAndSave).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'POST',
        targetResource: '/api/books',
        details: { statusCode: 201 },
        ipAddress: '127.0.0.1',
        userAgent: 'PostmanRuntime',
      });
      expect(result.id).toBe('log-1');
      expect(result.action).toBe('POST');
    });

    it('nên ném lỗi AppException nếu action bị rỗng', async () => {
      await expect(
        service.log({
          action: '',
          targetResource: '/api/books',
        }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném lỗi AppException nếu targetResource bị rỗng', async () => {
      await expect(
        service.log({
          action: 'POST',
          targetResource: '',
        }),
      ).rejects.toThrow(AppException);
    });
  });

  describe('getAuditLogs (Phân trang, search theo tên user, filter theo action)', () => {
    it('nên lấy danh sách log có phân trang, hỗ trợ search và filter', async () => {
      const mockUser = new User({
        id: 'user-1',
        username: 'johndoe',
        fullName: 'John Doe',
        email: 'john@example.com',
      });
      const mockLogs = [
        new AuditLog({
          id: 'log-1',
          userId: 'user-1',
          action: 'POST',
          targetResource: '/api/books',
          user: mockUser,
        }),
      ];
      auditLogRepo.findAuditLogs!.mockResolvedValue([mockLogs, 1]);

      const result = await service.getAuditLogs({
        page: 1,
        size: 10,
        search: 'John',
        action: 'POST',
      });

      expect(auditLogRepo.findAuditLogs).toHaveBeenCalledWith({
        page: 1,
        size: 10,
        search: 'John',
        action: 'POST',
      });
      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
      expect(result.total).toBe(1);
      expect(result.items[0].user?.fullName).toBe('John Doe');
    });
  });

  describe('getAuditLogById', () => {
    it('nên trả về chi tiết log theo ID', async () => {
      const mockLog = new AuditLog({
        id: 'log-1',
        action: 'DELETE',
        targetResource: '/api/loans/123',
      });
      auditLogRepo.findById!.mockResolvedValue(mockLog);

      const result = await service.getAuditLogById('log-1');

      expect(result.id).toBe('log-1');
      expect(result.action).toBe('DELETE');
    });

    it('nên ném AppException.notFound nếu log không tồn tại', async () => {
      auditLogRepo.findById!.mockResolvedValue(null);

      await expect(service.getAuditLogById('not-found')).rejects.toThrow(AppException);
    });
  });
});

