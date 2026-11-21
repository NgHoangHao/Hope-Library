import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service.js';
import { AppException } from '../common/index.js';

describe('RedisService (Upstash Redis Cloud)', () => {
  let service: RedisService;
  let mockUpstash: {
    set: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    exists: ReturnType<typeof vi.fn>;
    eval: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const configMap: Record<string, string> = {
      UPSTASH_REDIS_REST_URL: 'https://demo-upstash.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'demo-upstash-token',
    };

    const mockConfigService = {
      get: vi.fn((key: string) => configMap[key]),
    } as unknown as ConfigService;

    service = new RedisService(mockConfigService);
    service.onModuleInit();

    mockUpstash = {
      set: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      del: vi.fn().mockResolvedValue(1),
      exists: vi.fn().mockResolvedValue(1),
      eval: vi.fn().mockResolvedValue(1),
    };

    (service as any).upstashClient = mockUpstash;
  });

  it('nên khởi tạo ở chế độ Upstash REST khi có UPSTASH_REDIS_REST_URL và TOKEN', () => {
    expect((service as any).upstashClient).toBeTruthy();
    expect((service as any).ioRedisClient).toBeNull();
  });

  it('set nên ghi key có TTL bằng option { ex } trên Upstash', async () => {
    await service.set('otp:register:a@b.com', '{"otp":"123456"}', 300);
    expect(mockUpstash.set).toHaveBeenCalledWith(
      'otp:register:a@b.com',
      '{"otp":"123456"}',
      { ex: 300 },
    );
  });

  it('set không TTL nên gọi set(key, value) không truyền ex', async () => {
    await service.set('config:key', 'value');
    expect(mockUpstash.set).toHaveBeenCalledWith('config:key', 'value');
  });

  it('get nên trả về chuỗi raw JSON hoặc null', async () => {
    mockUpstash.get.mockResolvedValueOnce('{"otp":"123456"}');
    expect(await service.get('otp:key')).toBe('{"otp":"123456"}');

    mockUpstash.get.mockResolvedValueOnce(null);
    expect(await service.get('missing:key')).toBeNull();
  });

  it('del và exists hoạt động đúng qua Upstash client', async () => {
    await service.del('otp:key');
    expect(mockUpstash.del).toHaveBeenCalledWith('otp:key');

    mockUpstash.exists.mockResolvedValueOnce(1);
    expect(await service.exists('otp:key')).toBe(true);

    mockUpstash.exists.mockResolvedValueOnce(0);
    expect(await service.exists('missing')).toBe(false);
  });

  it('acquireLock và releaseLock sử dụng SET NX PX và Lua eval trên Upstash', async () => {
    mockUpstash.set.mockResolvedValueOnce('OK');
    const token = await service.acquireLock('lock:copy:1', 5000);
    expect(token).toBeTruthy();
    expect(mockUpstash.set).toHaveBeenCalledWith('lock:copy:1', token, {
      px: 5000,
      nx: true,
    });

    mockUpstash.eval.mockResolvedValueOnce(1);
    const released = await service.releaseLock('lock:copy:1', token!);
    expect(released).toBe(true);
    expect(mockUpstash.eval).toHaveBeenCalledWith(
      expect.stringContaining('redis.call("del", KEYS[1])'),
      ['lock:copy:1'],
      [token],
    );
  });

  it('ném AppException khi Upstash set/get gặp lỗi', async () => {
    mockUpstash.set.mockRejectedValueOnce(new Error('Upstash network error'));
    await expect(service.set('k', 'v', 60)).rejects.toThrow(AppException);

    mockUpstash.get.mockRejectedValueOnce(new Error('Upstash timeout'));
    await expect(service.get('k')).rejects.toThrow(AppException);
  });
});
