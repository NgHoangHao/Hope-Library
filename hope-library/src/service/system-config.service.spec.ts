import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMapper, type Mapper } from '@automapper/core';
import { classes } from '@automapper/classes';
import { SystemConfigService } from './system-config.service.js';
import { SystemConfigRepository } from '../repository/system-config.repository.js';
import { SystemConfigProfile } from '../mapper/system-config.mapper.js';
import {
  SystemConfig,
  SystemConfigValueType,
} from '../model/system-config/system-config.entity.js';
import { RedisService } from '../utils/redis.service.js';
import { AppException } from '../common/index.js';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let mapper: Mapper;
  let configRepo: Partial<Record<keyof SystemConfigRepository, ReturnType<typeof vi.fn>>>;
  let redisService: Partial<Record<keyof RedisService, ReturnType<typeof vi.fn>>>;

  beforeEach(() => {
    mapper = createMapper({ strategyInitializer: classes() });
    new SystemConfigProfile(mapper);

    configRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByKey: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      deleteByKey: vi.fn(),
    };

    redisService = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };

    service = new SystemConfigService(
      configRepo as unknown as SystemConfigRepository,
      mapper,
      redisService as unknown as RedisService,
    );
  });

  describe('getAllConfigs (Cache-Aside)', () => {
    it('nên trả về dữ liệu trực tiếp từ Redis Cache khi cache hit mà không query DB', async () => {
      const cachedList = [
        {
          id: 'cfg-1',
          key: 'OVERDUE_FINE_PER_DAY',
          value: '5000',
          valueType: SystemConfigValueType.NUMBER,
          group: 'LOAN',
          description: 'Tiền phạt quá hạn',
          isPublic: false,
        },
        {
          id: 'cfg-2',
          key: 'SITE_NAME',
          value: 'Hope Library',
          valueType: SystemConfigValueType.STRING,
          group: 'GENERAL',
          description: 'Tên thư viện',
          isPublic: true,
        },
      ];

      redisService.get!.mockResolvedValueOnce(JSON.stringify(cachedList));

      const result = await service.getAllConfigs();

      expect(redisService.get).toHaveBeenCalledWith(SystemConfigService.ALL_CONFIGS_CACHE_KEY);
      expect(configRepo.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('OVERDUE_FINE_PER_DAY');
    });

    it('nên lọc theo group từ kết quả cache hit', async () => {
      const cachedList = [
        { id: 'cfg-1', key: 'OVERDUE_FINE_PER_DAY', value: '5000', group: 'LOAN' },
        { id: 'cfg-2', key: 'SITE_NAME', value: 'Hope Library', group: 'GENERAL' },
      ];
      redisService.get!.mockResolvedValueOnce(JSON.stringify(cachedList));

      const result = await service.getAllConfigs('loan');

      expect(configRepo.findAll).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('OVERDUE_FINE_PER_DAY');
    });

    it('nên query DB và đẩy kết quả vào Redis Cache khi cache miss', async () => {
      redisService.get!.mockResolvedValueOnce(null);
      configRepo.findAll!.mockResolvedValueOnce([
        new SystemConfig({
          id: 'cfg-1',
          key: 'MAX_LOAN_DAYS',
          value: '14',
          valueType: SystemConfigValueType.NUMBER,
          group: 'LOAN',
        }),
      ]);

      const result = await service.getAllConfigs();

      expect(configRepo.findAll).toHaveBeenCalledTimes(1);
      expect(redisService.set).toHaveBeenCalledWith(
        SystemConfigService.ALL_CONFIGS_CACHE_KEY,
        expect.any(String),
        SystemConfigService.DEFAULT_CACHE_TTL_SECONDS,
      );
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('MAX_LOAN_DAYS');
    });
  });

  describe('getConfigByKey (Cache-Aside)', () => {
    it('nên đọc từ Redis trước nếu có (cache hit)', async () => {
      const cachedConfig = {
        id: 'cfg-1',
        key: 'OVERDUE_FINE_PER_DAY',
        value: '5000',
        valueType: SystemConfigValueType.NUMBER,
        isPublic: false,
      };
      redisService.get!.mockResolvedValueOnce(JSON.stringify(cachedConfig));

      const result = await service.getConfigByKey('OVERDUE_FINE_PER_DAY');

      expect(redisService.get).toHaveBeenCalledWith(
        `${SystemConfigService.CACHE_KEY_PREFIX}OVERDUE_FINE_PER_DAY`,
      );
      expect(configRepo.findByKey).not.toHaveBeenCalled();
      expect(result.value).toBe('5000');
    });

    it('nên query DB và đẩy vào Redis khi cache miss', async () => {
      redisService.get!.mockResolvedValueOnce(null);
      configRepo.findByKey!.mockResolvedValueOnce(
        new SystemConfig({
          id: 'cfg-1',
          key: 'OVERDUE_FINE_PER_DAY',
          value: '7000',
          valueType: SystemConfigValueType.NUMBER,
        }),
      );

      const result = await service.getConfigByKey('OVERDUE_FINE_PER_DAY');

      expect(configRepo.findByKey).toHaveBeenCalledWith('OVERDUE_FINE_PER_DAY');
      expect(redisService.set).toHaveBeenCalledWith(
        `${SystemConfigService.CACHE_KEY_PREFIX}OVERDUE_FINE_PER_DAY`,
        expect.stringContaining('"value":"7000"'),
        SystemConfigService.DEFAULT_CACHE_TTL_SECONDS,
      );
      expect(result.value).toBe('7000');
    });

    it('nên fallback sang DB nếu Redis gặp lỗi', async () => {
      redisService.get!.mockRejectedValueOnce(new Error('Redis down'));
      configRepo.findByKey!.mockResolvedValueOnce(
        new SystemConfig({
          id: 'cfg-1',
          key: 'OVERDUE_FINE_PER_DAY',
          value: '5000',
          valueType: SystemConfigValueType.NUMBER,
        }),
      );

      const result = await service.getConfigByKey('OVERDUE_FINE_PER_DAY');

      expect(configRepo.findByKey).toHaveBeenCalledWith('OVERDUE_FINE_PER_DAY');
      expect(result.value).toBe('5000');
    });

    it('nên ném AppException khi không tìm thấy key', async () => {
      redisService.get!.mockResolvedValueOnce(null);
      configRepo.findByKey!.mockResolvedValueOnce(null);

      await expect(service.getConfigByKey('UNKNOWN_KEY')).rejects.toThrow(AppException);
    });
  });

  describe('createConfig', () => {
    it('nên ném AppException nếu key trống', async () => {
      await expect(
        service.createConfig({ key: '   ', value: '5000' }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném AppException nếu key đã tồn tại', async () => {
      configRepo.findByKey!.mockResolvedValueOnce(
        new SystemConfig({ id: 'cfg-1', key: 'MAX_LOAN_DAYS', value: '14' }),
      );

      await expect(
        service.createConfig({ key: 'MAX_LOAN_DAYS', value: '20' }),
      ).rejects.toThrow(AppException);
    });

    it('nên ném AppException nếu value không khớp valueType NUMBER', async () => {
      configRepo.findByKey!.mockResolvedValueOnce(null);

      await expect(
        service.createConfig({
          key: 'MAX_LOAN_DAYS',
          value: 'not-a-number',
          valueType: SystemConfigValueType.NUMBER,
        }),
      ).rejects.toThrow(AppException);
    });

    it('nên lưu DB, ghi key vào Cache và xóa cache danh sách tổng ngay lập tức', async () => {
      configRepo.findByKey!.mockResolvedValueOnce(null);
      configRepo.save!.mockImplementationOnce(async (entity) => {
        return new SystemConfig({
          ...entity,
          id: 'cfg-new-1',
        });
      });

      const result = await service.createConfig(
        {
          key: 'OVERDUE_FINE_PER_DAY',
          value: '5000',
          valueType: SystemConfigValueType.NUMBER,
          group: 'LOAN',
          description: 'Tiền phạt mỗi ngày',
        },
        'admin@hopelib.vn',
      );

      expect(configRepo.save).toHaveBeenCalledTimes(1);
      expect(redisService.set).toHaveBeenCalledWith(
        `${SystemConfigService.CACHE_KEY_PREFIX}OVERDUE_FINE_PER_DAY`,
        expect.stringContaining('"value":"5000"'),
        SystemConfigService.DEFAULT_CACHE_TTL_SECONDS,
      );
      expect(redisService.del).toHaveBeenCalledWith(SystemConfigService.ALL_CONFIGS_CACHE_KEY);
      expect(result.id).toBe('cfg-new-1');
      expect(result.key).toBe('OVERDUE_FINE_PER_DAY');
    });
  });

  describe('updateConfig & updateConfigByKey', () => {
    it('nên lưu DB và cập nhật lại key trong Cache ngay lập tức khi Admin sửa giá trị', async () => {
      const existing = new SystemConfig({
        id: 'cfg-1',
        key: 'OVERDUE_FINE_PER_DAY',
        value: '5000',
        valueType: SystemConfigValueType.NUMBER,
        group: 'LOAN',
      });
      configRepo.findById!.mockResolvedValueOnce(existing);
      configRepo.save!.mockImplementationOnce(async (entity) => entity);

      const result = await service.updateConfig('cfg-1', { value: '10000' }, 'admin@hopelib.vn');

      expect(configRepo.save).toHaveBeenCalledTimes(1);
      expect(result.value).toBe('10000');
      expect(redisService.set).toHaveBeenCalledWith(
        `${SystemConfigService.CACHE_KEY_PREFIX}OVERDUE_FINE_PER_DAY`,
        expect.stringContaining('"value":"10000"'),
        SystemConfigService.DEFAULT_CACHE_TTL_SECONDS,
      );
      expect(redisService.del).toHaveBeenCalledWith(SystemConfigService.ALL_CONFIGS_CACHE_KEY);
    });

    it('nên xóa key cũ khỏi Cache nếu đổi tên key', async () => {
      const existing = new SystemConfig({
        id: 'cfg-1',
        key: 'OLD_KEY',
        value: 'abc',
        valueType: SystemConfigValueType.STRING,
      });
      configRepo.findById!.mockResolvedValueOnce(existing);
      configRepo.findByKey!.mockResolvedValueOnce(null);
      configRepo.save!.mockImplementationOnce(async (entity) => entity);

      const result = await service.updateConfig('cfg-1', { key: 'NEW_KEY', value: 'xyz' });

      expect(result.key).toBe('NEW_KEY');
      expect(redisService.del).toHaveBeenCalledWith(
        `${SystemConfigService.CACHE_KEY_PREFIX}OLD_KEY`,
      );
      expect(redisService.set).toHaveBeenCalledWith(
        `${SystemConfigService.CACHE_KEY_PREFIX}NEW_KEY`,
        expect.stringContaining('"value":"xyz"'),
        SystemConfigService.DEFAULT_CACHE_TTL_SECONDS,
      );
      expect(redisService.del).toHaveBeenCalledWith(SystemConfigService.ALL_CONFIGS_CACHE_KEY);
    });

    it('nên cập nhật thành công theo key qua updateConfigByKey', async () => {
      const existing = new SystemConfig({
        id: 'cfg-1',
        key: 'ENABLE_RESERVATION',
        value: 'true',
        valueType: SystemConfigValueType.BOOLEAN,
      });
      configRepo.findByKey!.mockResolvedValueOnce(existing);
      configRepo.findById!.mockResolvedValueOnce(existing);
      configRepo.save!.mockImplementationOnce(async (entity) => entity);

      const result = await service.updateConfigByKey('ENABLE_RESERVATION', { value: 'false' });

      expect(result.value).toBe('false');
      expect(redisService.set).toHaveBeenCalledWith(
        `${SystemConfigService.CACHE_KEY_PREFIX}ENABLE_RESERVATION`,
        expect.stringContaining('"value":"false"'),
        SystemConfigService.DEFAULT_CACHE_TTL_SECONDS,
      );
    });
  });

  describe('deleteConfig', () => {
    it('nên xóa khỏi DB và xóa ngay key + danh sách khỏi Cache', async () => {
      configRepo.findById!.mockResolvedValueOnce(
        new SystemConfig({
          id: 'cfg-1',
          key: 'OVERDUE_FINE_PER_DAY',
          value: '5000',
        }),
      );
      configRepo.delete!.mockResolvedValueOnce(true);

      await service.deleteConfig('cfg-1');

      expect(configRepo.delete).toHaveBeenCalledWith('cfg-1');
      expect(redisService.del).toHaveBeenCalledWith(
        `${SystemConfigService.CACHE_KEY_PREFIX}OVERDUE_FINE_PER_DAY`,
      );
      expect(redisService.del).toHaveBeenCalledWith(SystemConfigService.ALL_CONFIGS_CACHE_KEY);
    });
  });

  describe('Runtime typed helpers', () => {
    it('getNumber nên đọc từ cache và fallback khi không tồn tại', async () => {
      redisService.get!.mockResolvedValueOnce(
        JSON.stringify({ key: 'OVERDUE_FINE_PER_DAY', value: '8000' }),
      );
      const val = await service.getNumber('OVERDUE_FINE_PER_DAY', 5000);
      expect(val).toBe(8000);

      redisService.get!.mockResolvedValueOnce(null);
      configRepo.findByKey!.mockResolvedValueOnce(null);
      const fallback = await service.getNumber('MISSING_KEY', 5000);
      expect(fallback).toBe(5000);
    });

    it('getBoolean và getJson nên parse đúng giá trị', async () => {
      redisService.get!.mockResolvedValueOnce(
        JSON.stringify({ key: 'MAINTENANCE_MODE', value: 'true' }),
      );
      expect(await service.getBoolean('MAINTENANCE_MODE', false)).toBe(true);

      redisService.get!.mockResolvedValueOnce(
        JSON.stringify({ key: 'OPENING_HOURS', value: '{"open":"08:00","close":"20:00"}' }),
      );
      expect(await service.getJson('OPENING_HOURS', { open: '', close: '' })).toEqual({
        open: '08:00',
        close: '20:00',
      });
    });
  });
});
