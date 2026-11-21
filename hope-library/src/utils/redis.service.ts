import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis as UpstashRedis } from '@upstash/redis';
import { Redis as IoRedis } from 'ioredis';
import { AppException } from '../common/index.js';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private upstashClient: UpstashRedis | null = null;
  private ioRedisClient: IoRedis | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getEnv(key: string, defaultValue?: string): string | undefined {
    const val = this.configService?.get<string>(key) ?? process.env[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
    return defaultValue;
  }

  onModuleInit(): void {
    const upstashUrl = this.getEnv('UPSTASH_REDIS_REST_URL');
    const upstashToken = this.getEnv('UPSTASH_REDIS_REST_TOKEN');

    // Ưu tiên 1: Upstash Redis Cloud REST API (ổn định nhất cho Render / Cloud, không bị rớt TCP socket)
    if (upstashUrl && upstashToken) {
      this.upstashClient = new UpstashRedis({
        url: upstashUrl,
        token: upstashToken,
        // Tắt tự động JSON.parse để luôn trả về raw string tương thích 100% với AuthService / SystemConfigService
        automaticDeserialization: false,
      });
      this.logger.log(`Đã cấu hình Upstash Redis Cloud (REST API): ${upstashUrl}`);
      return;
    }

    // Ưu tiên 2: Kết nối qua REDIS_URL (ví dụ rediss://default:<password>@<host>.upstash.io:6379)
    const redisUrl = this.getEnv('REDIS_URL');
    if (redisUrl) {
      const useTls = redisUrl.startsWith('rediss://');
      this.ioRedisClient = new IoRedis(redisUrl, {
        ...(useTls ? { tls: {} } : {}),
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 5) {
            this.logger.warn(`Đã thử kết nối Redis URL ${times} lần nhưng không thành công.`);
            return null;
          }
          return Math.min(times * 300, 2000);
        },
      });

      this.ioRedisClient.on('connect', () => {
        this.logger.log(
          `Kết nối Redis Cloud thành công qua REDIS_URL (TLS: ${useTls ? 'ON' : 'OFF'})`,
        );
      });

      this.ioRedisClient.on('error', (err) => {
        this.logger.error(`Redis connection error: ${err.message}`);
      });
      return;
    }

    // Ưu tiên 3 (Fallback): Cấu hình host/port truyền thống
    const host = this.getEnv('REDIS_HOST', 'localhost')!;
    const port = Number(this.getEnv('REDIS_PORT', '6379'));
    const password = this.getEnv('REDIS_PASSWORD');
    const db = Number(this.getEnv('REDIS_DB', '0'));
    const useTls = this.getEnv('REDIS_TLS') === 'true';

    this.ioRedisClient = new IoRedis({
      host,
      port,
      password,
      db,
      ...(useTls ? { tls: {} } : {}),
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn(`Đã thử kết nối Redis ${times} lần nhưng không thành công.`);
          return null;
        }
        return Math.min(times * 300, 2000);
      },
    });

    this.ioRedisClient.on('connect', () => {
      this.logger.log(`Kết nối Redis thành công tới ${host}:${port} (db: ${db})`);
    });

    this.ioRedisClient.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.ioRedisClient) {
      try {
        await this.ioRedisClient.quit();
      } catch {
        this.ioRedisClient.disconnect();
      }
      this.ioRedisClient = null;
    }
    this.upstashClient = null;
  }

  /**
   * Lưu key-value lên Redis với thời gian sống TTL tính bằng giây
   * @param key Khóa lưu trữ
   * @param value Giá trị chuỗi (hoặc JSON stringified)
   * @param ttlSeconds Thời hạn tính theo giây (ví dụ: 300 cho 5 phút)
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (this.upstashClient) {
        if (ttlSeconds && ttlSeconds > 0) {
          await this.upstashClient.set(key, value, { ex: ttlSeconds });
        } else {
          await this.upstashClient.set(key, value);
        }
        return;
      }

      if (!this.ioRedisClient) {
        throw new Error('Redis client chưa được khởi tạo');
      }

      if (ttlSeconds && ttlSeconds > 0) {
        await this.ioRedisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.ioRedisClient.set(key, value);
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
      if (this.upstashClient) {
        const val = await this.upstashClient.get<string | null>(key);
        if (val === null || val === undefined) {
          return null;
        }
        return typeof val === 'string' ? val : JSON.stringify(val);
      }

      if (!this.ioRedisClient) {
        throw new Error('Redis client chưa được khởi tạo');
      }

      return await this.ioRedisClient.get(key);
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
      if (this.upstashClient) {
        await this.upstashClient.del(key);
        return;
      }

      if (!this.ioRedisClient) {
        return;
      }

      await this.ioRedisClient.del(key);
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
      if (this.upstashClient) {
        const result = await this.upstashClient.exists(key);
        return result > 0;
      }

      if (!this.ioRedisClient) {
        return false;
      }

      const result = await this.ioRedisClient.exists(key);
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

      if (this.upstashClient) {
        const res = await this.upstashClient.set(key, token, { px: ttlMs, nx: true });
        return res === 'OK' ? token : null;
      }

      if (!this.ioRedisClient) {
        return null;
      }

      const res = await this.ioRedisClient.set(key, token, 'PX', ttlMs, 'NX');
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
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    try {
      if (this.upstashClient) {
        const result = await this.upstashClient.eval(luaScript, [key], [token]);
        return Number(result) === 1;
      }

      if (!this.ioRedisClient) {
        return false;
      }

      const result = await this.ioRedisClient.eval(luaScript, 1, key, token);
      return Number(result) === 1;
    } catch (error: any) {
      this.logger.error(`Lỗi releaseLock cho key [${key}]: ${error.message}`);
      return false;
    }
  }
}
