import { Injectable, Logger } from '@nestjs/common';
import { AuditLogRepository } from '../repository/audit-log.repository.js';
import { AuditLogMapper } from '../mapper/audit-log.mapper.js';
import {
  AuditLogResponse,
  CreateAuditLogDto,
  PaginatedAuditLogResponse,
  QueryAuditLogDto,
} from '../model/audit-log/audit-log.dto.js';
import { AppException } from '../common/index.js';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    private readonly auditLogRepo: AuditLogRepository,
    private readonly auditLogMapper: AuditLogMapper,
  ) {}

  /**
   * Function tạo log: lưu 1 bản ghi AuditLog vào cơ sở dữ liệu
   */
  async log(dto: CreateAuditLogDto): Promise<AuditLogResponse> {
    if (!dto.action || !dto.action.trim()) {
      throw AppException.badRequest(
        'Hành động (action) không được để trống',
        { field: 'action' },
        'ACTION_REQUIRED',
      );
    }

    if (!dto.targetResource || !dto.targetResource.trim()) {
      throw AppException.badRequest(
        'Tài nguyên mục tiêu (targetResource) không được để trống',
        { field: 'targetResource' },
        'TARGET_RESOURCE_REQUIRED',
      );
    }

    try {
      const saved = await this.auditLogRepo.createAndSave({
        userId: dto.userId || null,
        action: dto.action.trim().toUpperCase(),
        targetResource: dto.targetResource.trim(),
        details: dto.details ?? null,
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ?? null,
      });

      return this.auditLogMapper.toResponse(saved);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error(`Lỗi khi tạo bản ghi audit log: ${(error as Error).message}`);
      throw AppException.internal(
        'Đã có lỗi hệ thống xảy ra khi lưu nhật ký kiểm toán',
        { error: (error as Error).message },
        'CREATE_AUDIT_LOG_FAILED',
      );
    }
  }

  /**
   * Ghi log dạng bất đồng bộ (chạy ngầm, không block và không ném lỗi ra luồng chính của client)
   */
  logAsync(dto: CreateAuditLogDto): void {
    this.log(dto).catch((err) => {
      this.logger.warn(`Không thể ghi log ngầm: ${err.message}`);
    });
  }

  /**
   * Lấy danh sách nhật ký kiểm toán có phân trang, tìm kiếm theo tên user và lọc theo GET/POST/PUT/DELETE
   */
  async getAuditLogs(query?: QueryAuditLogDto): Promise<PaginatedAuditLogResponse> {
    const pageNumber = Math.max(1, Number(query?.page) || 1);
    const pageSize = Math.max(1, Number(query?.size) || 10);

    const [logs, total] = await this.auditLogRepo.findAuditLogs({
      page: pageNumber,
      size: pageSize,
      search: query?.search,
      action: query?.action,
    });

    return this.auditLogMapper.toPaginatedResponse(logs, total, pageNumber, pageSize);
  }

  /**
   * Lấy chi tiết 1 bản ghi nhật ký kiểm toán theo ID
   */
  async getAuditLogById(id: string): Promise<AuditLogResponse> {
    const log = await this.auditLogRepo.findById(id);
    if (!log) {
      throw AppException.notFound(
        `Không tìm thấy nhật ký kiểm toán với ID: ${id}`,
        { id },
        'AUDIT_LOG_NOT_FOUND',
      );
    }
    return this.auditLogMapper.toResponse(log);
  }
}

