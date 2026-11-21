import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../model/audit-log/audit-log.entity.js';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  /**
   * Truy vấn danh sách nhật ký kiểm toán có phân trang, tìm kiếm theo tên user và lọc theo action
   */
  async findAuditLogs(options: {
    page: number;
    size: number;
    search?: string;
    action?: string;
  }): Promise<[AuditLog[], number]> {
    const { page, size, search, action } = options;
    const skip = (page - 1) * size;

    const qb = this.auditLogRepo
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user');

    // Tìm kiếm theo tên người dùng (fullName, username hoặc email)
    if (search && search.trim()) {
      const keyword = `%${search.trim()}%`;
      qb.andWhere(
        '(user.fullName LIKE :keyword OR user.username LIKE :keyword OR user.email LIKE :keyword)',
        { keyword },
      );
    }

    // Lọc theo action (GET, POST, PUT, DELETE - không phân biệt hoa thường)
    if (action && action.trim()) {
      qb.andWhere('UPPER(auditLog.action) = UPPER(:action)', {
        action: action.trim(),
      });
    }

    return await qb
      .orderBy('auditLog.createdAt', 'DESC')
      .skip(skip)
      .take(size)
      .getManyAndCount();
  }

  /**
   * Tìm chi tiết nhật ký theo ID kèm thông tin người dùng
   */
  async findById(id: string): Promise<AuditLog | null> {
    return this.auditLogRepo.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  /**
   * Tạo mới và lưu bản ghi nhật ký
   */
  async createAndSave(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.auditLogRepo.create(data);
    return this.auditLogRepo.save(log);
  }

  /**
   * Lưu thực thể nhật ký
   */
  async save(auditLog: AuditLog): Promise<AuditLog> {
    return this.auditLogRepo.save(auditLog);
  }
}

