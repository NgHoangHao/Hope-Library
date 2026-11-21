import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { AppException } from '../common/index.js';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = Number(this.configService.get<string>('REDIS_PORT', '6379'));
    const password = this.configService.get<string>('REDIS_PASSWORD') || undefined;
    const db = Number(this.configService.get<string>('REDIS_DB', '0'));

    this.client = new Redis({
      host,
      port,
      password: password && password.trim().length > 0 ? password : undefined,
      db,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn(`Đã thử kết nối Redis ${times} lần nhưng không thành công.`);
          return null; // Dừng retry tự động liên tục
        }
        return Math.min(times * 300, 2000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log(`Kết nối Redis thành công tới ${host}:${port} (db: ${db})`);
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
    }
  }

  /**
   * Lưu key-value lên Redis với thời gian sống TTL tính bằng giây
   * @param key Khóa lưu trữ
   * @param value Giá trị chuỗi (hoặc JSON stringified)
   * @param ttlSeconds Thời hạn tính theo giây (ví dụ: 300 cho 5 phút)
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (error: any) {
      this.logger.error(`Lỗi ghi Redis cho key [${key}]: ${error.message}`);
      throw AppException.internal(
        'Lỗi lưu trữ dữ liệu xác thực vào Redis',
        { key, error: error.message },
        'REDIS_SET_ERROR',
      );
    }
  }

  /**
   * Đọc giá trị từ Redis theo key
   * @param key Khóa cần lấy
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error: any) {
      this.logger.error(`Lỗi đọc Redis cho key [${key}]: ${error.message}`);
      throw AppException.internal(
        'Lỗi truy vấn dữ liệu xác thực từ Redis',
        { key, error: error.message },
        'REDIS_GET_ERROR',
      );
    }
  }

  /**
   * Xóa key khỏi Redis
   * @param key Khóa cần xóa
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error: any) {
      this.logger.error(`Lỗi xóa key [${key}] từ Redis: ${error.message}`);
    }
  }

  /**
   * Kiểm tra key có tồn tại trong Redis không
   * @param key Khóa cần kiểm tra
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result > 0;
    } catch (error: any) {
      this.logger.error(`Lỗi kiểm tra key [${key}] trong Redis: ${error.message}`);
      return false;
    }
  }

  /**
   * Cố gắng lấy khóa phân tán (Distributed Lock) sử dụng Redis SET NX PX
   * @param key Khóa cần lock (vd: lock:book-copy:uuid)
   * @param ttlMs Thời gian sống của lock tính bằng mili giây (mặc định 10.000ms = 10s)
   * @returns lockToken nếu lock thành công, null nếu khóa đang bị giữ bởi tiến trình khác
   */
  async acquireLock(key: string, ttlMs: number = 10000): Promise<string | null> {
    try {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const res = await this.client.set(key, token, 'PX', ttlMs, 'NX');
      return res === 'OK' ? token : null;
    } catch (error: any) {
      this.logger.error(`Lỗi acquireLock cho key [${key}]: ${error.message}`);
      return null;
    }
  }

  /**
   * Giải phóng khóa phân tán an toàn bằng Lua script (chỉ giải phóng khi đúng token)
   * @param key Khóa cần giải phóng
   * @param token Token định danh do acquireLock trả về
   */
  async releaseLock(key: string, token: string): Promise<boolean> {
    if (!token) return false;
    try {
      const luaScript = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await this.client.eval(luaScript, 1, key, token);
      return result === 1;
    } catch (error: any) {
      this.logger.error(`Lỗi releaseLock cho key [${key}]: ${error.message}`);
      return false;
    }
  }
}
