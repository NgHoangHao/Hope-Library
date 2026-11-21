import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AuditLog } from '../model/audit-log/audit-log.entity.js';
import { User } from '../model/user/user.entity.js';
import {
  buildContainsRegex,
  buildExactIgnoreCaseRegex,
  prepareDocumentForSave,
  toEntities,
  toEntity,
} from '../database/mongo.helper.js';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLog>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
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

    const filter: Record<string, any> = {};

    if (search && search.trim()) {
      const regex = buildContainsRegex(search);
      const matchedUsers = await this.userModel
        .find(
          {
            $or: [
              { fullName: regex },
              { username: regex },
              { email: regex },
            ],
          },
          { id: 1 },
        )
        .lean()
        .exec();

      const matchedUserIds = matchedUsers.map((u) => u.id);
      if (matchedUserIds.length === 0) {
        return [[], 0];
      }
      filter.userId = { $in: matchedUserIds };
    }

    if (action && action.trim()) {
      filter.action = buildExactIgnoreCaseRegex(action);
    }

    const [docs, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(size)
        .lean()
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    const logs = toEntities(AuditLog, docs);
    const userIds = [
      ...new Set(
        logs
          .map((l) => l.userId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (userIds.length > 0) {
      const userDocs = await this.userModel
        .find({ id: { $in: userIds } })
        .lean()
        .exec();
      const userMap = new Map(
        toEntities(User, userDocs).map((u) => [u.id, u]),
      );
      for (const log of logs) {
        if (log.userId) {
          log.user = userMap.get(log.userId) ?? null;
        }
      }
    }

    return [logs, total];
  }

  /**
   * Tìm chi tiết nhật ký theo ID kèm thông tin người dùng
   */
  async findById(id: string): Promise<AuditLog | null> {
    const doc = await this.auditLogModel.findOne({ id }).lean().exec();
    const log = toEntity(AuditLog, doc);
    if (!log) {
      return null;
    }
    if (log.userId) {
      const userDoc = await this.userModel
        .findOne({ id: log.userId })
        .lean()
        .exec();
      log.user = toEntity(User, userDoc);
    }
    return log;
  }

  /**
   * Tạo mới và lưu bản ghi nhật ký
   */
  async createAndSave(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = new AuditLog(data);
    return this.save(log);
  }

  /**
   * Lưu thực thể nhật ký
   */
  async save(auditLog: AuditLog): Promise<AuditLog> {
    const payload = prepareDocumentForSave(auditLog);
    const saved = await this.auditLogModel
      .findOneAndUpdate(
        { id: payload.id },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return toEntity(AuditLog, saved) ?? auditLog;
  }
}
