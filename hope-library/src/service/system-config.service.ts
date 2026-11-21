import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectMapper } from '@automapper/nestjs';
import { type Mapper } from '@automapper/core';
import { SystemConfigRepository } from '../repository/system-config.repository.js';
import {
  SystemConfig,
  SystemConfigValueType,
} from '../model/system-config/system-config.entity.js';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  SystemConfigResponse,
} from '../model/system-config/system-config.dto.js';
import { RedisService } from '../utils/redis.service.js';
import { AppException } from '../common/index.js';

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  static readonly CACHE_KEY_PREFIX = 'system_config:key:';
  static readonly ALL_CONFIGS_CACHE_KEY = 'system_config:all';
  static readonly DEFAULT_CACHE_TTL_SECONDS = 3600; // 1 giờ

  constructor(
    private readonly systemConfigRepo: SystemConfigRepository,
    @InjectMapper() private readonly mapper: Mapper,
    @Optional() private readonly redisService?: RedisService,
  ) {}

  get systemConfigRepository(): SystemConfigRepository {
    return this.systemConfigRepo;
  }

  private buildKeyCacheKey(key: string): string {
    return `${SystemConfigService.CACHE_KEY_PREFIX}${key}`;
  }

  private async readFromCache<T>(cacheKey: string): Promise<T | null> {
    if (!this.redisService) return null;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (!cached) return null;
      return JSON.parse(cached) as T;
    } catch (error: any) {
      this.logger.warn(
        `Không thể đọc cache Redis cho [${cacheKey}], fallback sang DB: ${error?.message ?? error}`,
      );
      return null;
    }
  }

  private async writeToCache(cacheKey: string, payload: unknown): Promise<void> {
    if (!this.redisService) return;
    try {
      await this.redisService.set(
        cacheKey,
        JSON.stringify(payload),
        SystemConfigService.DEFAULT_CACHE_TTL_SECONDS,
      );
    } catch (error: any) {
      this.logger.warn(
        `Không thể ghi cache Redis cho [${cacheKey}]: ${error?.message ?? error}`,
      );
    }
  }

  private async deleteFromCache(cacheKey: string): Promise<void> {
    if (!this.redisService) return;
    try {
      await this.redisService.del(cacheKey);
    } catch (error: any) {
      this.logger.warn(
        `Không thể xóa cache Redis cho [${cacheKey}]: ${error?.message ?? error}`,
      );
    }
  }

  private normalizeValueType(valueType?: SystemConfigValueType): SystemConfigValueType {
    if (!valueType) return SystemConfigValueType.STRING;
    const validTypes = Object.values(SystemConfigValueType);
    if (!validTypes.includes(valueType)) {
      throw AppException.badRequest(
        `Kiểu dữ liệu cấu hình không hợp lệ: ${valueType}`,
        { field: 'valueType', allowedValues: validTypes },
        'INVALID_SYSTEM_CONFIG_VALUE_TYPE',
      );
    }
    return valueType;
  }

  private validateValueByType(value: string, valueType: SystemConfigValueType): void {
    switch (valueType) {
      case SystemConfigValueType.NUMBER: {
        if (value.trim() === '' || !Number.isFinite(Number(value))) {
          throw AppException.badRequest(
            `Giá trị '${value}' không hợp lệ với kiểu dữ liệu NUMBER`,
            { field: 'value', valueType },
            'INVALID_SYSTEM_CONFIG_VALUE',
          );
        }
        break;
      }
      case SystemConfigValueType.BOOLEAN: {
        const normalized = value.trim().toLowerCase();
        if (normalized !== 'true' && normalized !== 'false') {
          throw AppException.badRequest(
            `Giá trị '${value}' không hợp lệ với kiểu dữ liệu BOOLEAN (chỉ chấp nhận 'true' hoặc 'false')`,
            { field: 'value', valueType },
            'INVALID_SYSTEM_CONFIG_VALUE',
          );
        }
        break;
      }
      case SystemConfigValueType.JSON: {
        try {
          JSON.parse(value);
        } catch {
          throw AppException.badRequest(
            'Giá trị không đúng định dạng JSON hợp lệ',
            { field: 'value', valueType },
            'INVALID_SYSTEM_CONFIG_VALUE',
          );
        }
        break;
      }
      case SystemConfigValueType.STRING:
      default:
        break;
    }
  }

  /**
   * Lấy danh sách toàn bộ cấu hình (Cache-Aside):
   * - Tìm trong Redis trước (`system_config:all`)
   * - Nếu không có -> query DB -> đẩy vào Redis Cache
   * - Nếu có truyền `group` -> lọc theo nhóm
   */
  async getAllConfigs(group?: string): Promise<SystemConfigResponse[]> {
    const trimmedGroup = group?.trim();
    let allConfigs = await this.readFromCache<SystemConfigResponse[]>(
      SystemConfigService.ALL_CONFIGS_CACHE_KEY,
    );

    if (!allConfigs) {
      const entities = await this.systemConfigRepo.findAll();
      allConfigs = this.mapper.mapArray(entities, SystemConfig, SystemConfigResponse);
      await this.writeToCache(SystemConfigService.ALL_CONFIGS_CACHE_KEY, allConfigs);
    }

    if (trimmedGroup) {
      return allConfigs.filter(
        (item) => (item.group ?? '').toLowerCase() === trimmedGroup.toLowerCase(),
      );
    }

    return allConfigs;
  }

  /**
   * Lấy cấu hình theo key (Cache-Aside):
   * - Tìm trong Redis trước (`system_config:key:<key>`)
   * - Nếu không có -> query DB -> đẩy vào Redis Cache
   */
  async getConfigByKey(key: string): Promise<SystemConfigResponse> {
    const trimmedKey = key?.trim();
    if (!trimmedKey) {
      throw AppException.badRequest(
        'Khóa cấu hình không được để trống',
        { field: 'key' },
        'SYSTEM_CONFIG_KEY_REQUIRED',
      );
    }

    const cacheKey = this.buildKeyCacheKey(trimmedKey);
    const cached = await this.readFromCache<SystemConfigResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const entity = await this.systemConfigRepo.findByKey(trimmedKey);
    if (!entity) {
      throw AppException.notFound(
        `Không tìm thấy cấu hình với key: ${trimmedKey}`,
        { key: trimmedKey },
        'SYSTEM_CONFIG_NOT_FOUND',
      );
    }

    const response = this.mapper.map(entity, SystemConfig, SystemConfigResponse);
    await this.writeToCache(cacheKey, response);
    return response;
  }

  /**
   * Lấy chi tiết cấu hình theo ID
   */
  async getConfigById(id: string): Promise<SystemConfigResponse> {
    const cachedList = await this.readFromCache<SystemConfigResponse[]>(
      SystemConfigService.ALL_CONFIGS_CACHE_KEY,
    );
    if (cachedList) {
      const foundInCache = cachedList.find((item) => item.id === id);
      if (foundInCache) {
        return foundInCache;
      }
    }

    const entity = await this.systemConfigRepo.findById(id);
    if (!entity) {
      throw AppException.notFound(
        `Không tìm thấy cấu hình với ID: ${id}`,
        { id },
        'SYSTEM_CONFIG_NOT_FOUND',
      );
    }

    const response = this.mapper.map(entity, SystemConfig, SystemConfigResponse);
    await this.writeToCache(this.buildKeyCacheKey(response.key), response);
    return response;
  }

  /**
   * Tạo mới một thông số cấu hình:
   * - Lưu xuống DB
   * - Cập nhật key mới vào Cache và xóa cache danh sách tổng ngay lập tức
   */
  async createConfig(
    dto: CreateSystemConfigDto,
    actor?: string,
  ): Promise<SystemConfigResponse> {
    if (!dto.key || !dto.key.trim()) {
      throw AppException.badRequest(
        'Khóa cấu hình không được để trống',
        { field: 'key' },
        'SYSTEM_CONFIG_KEY_REQUIRED',
      );
    }

    if (dto.value === undefined || dto.value === null) {
      throw AppException.badRequest(
        'Giá trị cấu hình không được để trống',
        { field: 'value' },
        'SYSTEM_CONFIG_VALUE_REQUIRED',
      );
    }

    const trimmedKey = dto.key.trim();
    const existing = await this.systemConfigRepo.findByKey(trimmedKey);
    if (existing) {
      throw AppException.conflict(
        `Khóa cấu hình '${trimmedKey}' đã tồn tại trong hệ thống`,
        { key: trimmedKey },
        'SYSTEM_CONFIG_KEY_CONFLICT',
      );
    }

    const valueType = this.normalizeValueType(dto.valueType);
    const stringValue = String(dto.value);
    this.validateValueByType(stringValue, valueType);

    const entity = this.mapper.map(dto, CreateSystemConfigDto, SystemConfig);
    entity.key = trimmedKey;
    entity.value = stringValue;
    entity.valueType = valueType;
    entity.group = dto.group?.trim() || null;
    entity.description = dto.description?.trim() || null;
    entity.isPublic = dto.isPublic ?? false;
    if (actor) {
      entity.createdBy = actor;
      entity.updatedBy = actor;
    }

    const saved = await this.systemConfigRepo.save(entity);
    const response = this.mapper.map(saved, SystemConfig, SystemConfigResponse);

    await this.writeToCache(this.buildKeyCacheKey(response.key), response);
    await this.deleteFromCache(SystemConfigService.ALL_CONFIGS_CACHE_KEY);

    return response;
  }

  /**
   * Cập nhật thông số cấu hình theo ID:
   * - Lưu xuống DB
   * - Cập nhật lại key trong Cache ngay lập tức (và xóa key cũ nếu đổi tên key) + xóa cache danh sách tổng
   */
  async updateConfig(
    id: string,
    dto: UpdateSystemConfigDto,
    actor?: string,
  ): Promise<SystemConfigResponse> {
    const entity = await this.systemConfigRepo.findById(id);
    if (!entity) {
      throw AppException.notFound(
        `Không tìm thấy cấu hình với ID: ${id}`,
        { id },
        'SYSTEM_CONFIG_NOT_FOUND',
      );
    }

    const oldKey = entity.key;

    if (dto.key !== undefined) {
      if (!dto.key.trim()) {
        throw AppException.badRequest(
          'Khóa cấu hình không hợp lệ',
          { field: 'key' },
          'INVALID_SYSTEM_CONFIG_KEY',
        );
      }

      const trimmedKey = dto.key.trim();
      if (trimmedKey !== entity.key) {
        const existing = await this.systemConfigRepo.findByKey(trimmedKey);
        if (existing && existing.id !== id) {
          throw AppException.conflict(
            `Khóa cấu hình '${trimmedKey}' đã tồn tại trong hệ thống`,
            { key: trimmedKey },
            'SYSTEM_CONFIG_KEY_CONFLICT',
          );
        }
        entity.key = trimmedKey;
      }
    }

    const effectiveValueType =
      dto.valueType !== undefined
        ? this.normalizeValueType(dto.valueType)
        : entity.valueType;

    const effectiveValue =
      dto.value !== undefined && dto.value !== null
        ? String(dto.value)
        : entity.value;

    this.validateValueByType(effectiveValue, effectiveValueType);

    entity.valueType = effectiveValueType;
    entity.value = effectiveValue;

    if (dto.group !== undefined) {
      entity.group = dto.group?.trim() || null;
    }
    if (dto.description !== undefined) {
      entity.description = dto.description?.trim() || null;
    }
    if (dto.isPublic !== undefined) {
      entity.isPublic = dto.isPublic;
    }

    if (actor) {
      entity.updatedBy = actor;
    }
    entity.updatedAt = new Date();

    const updated = await this.systemConfigRepo.save(entity);
    const response = this.mapper.map(updated, SystemConfig, SystemConfigResponse);

    if (oldKey !== response.key) {
      await this.deleteFromCache(this.buildKeyCacheKey(oldKey));
    }
    await this.writeToCache(this.buildKeyCacheKey(response.key), response);
    await this.deleteFromCache(SystemConfigService.ALL_CONFIGS_CACHE_KEY);

    return response;
  }

  /**
   * Cập nhật thông số cấu hình trực tiếp theo Key (thuận tiện cho Admin UI):
   * - Lưu xuống DB
   * - Cập nhật lại key trong Cache ngay lập tức + xóa cache danh sách tổng
   */
  async updateConfigByKey(
    key: string,
    dto: UpdateSystemConfigDto,
    actor?: string,
  ): Promise<SystemConfigResponse> {
    const trimmedKey = key?.trim();
    if (!trimmedKey) {
      throw AppException.badRequest(
        'Khóa cấu hình không được để trống',
        { field: 'key' },
        'SYSTEM_CONFIG_KEY_REQUIRED',
      );
    }

    const entity = await this.systemConfigRepo.findByKey(trimmedKey);
    if (!entity) {
      throw AppException.notFound(
        `Không tìm thấy cấu hình với key: ${trimmedKey}`,
        { key: trimmedKey },
        'SYSTEM_CONFIG_NOT_FOUND',
      );
    }

    return this.updateConfig(
      entity.id,
      {
        ...dto,
        key: undefined, // Không đổi key qua endpoint update-by-key
      },
      actor,
    );
  }

  /**
   * Xóa thông số cấu hình theo ID:
   * - Xóa khỏi DB
   * - Xóa key và danh sách tổng khỏi Cache ngay lập tức
   */
  async deleteConfig(id: string): Promise<void> {
    const entity = await this.systemConfigRepo.findById(id);
    if (!entity) {
      throw AppException.notFound(
        `Không tìm thấy cấu hình với ID: ${id}`,
        { id },
        'SYSTEM_CONFIG_NOT_FOUND',
      );
    }

    const isDeleted = await this.systemConfigRepo.delete(id);
    if (!isDeleted) {
      throw AppException.badRequest(
        `Xóa cấu hình thất bại với ID: ${id}`,
        { id },
        'DELETE_SYSTEM_CONFIG_FAILED',
      );
    }

    await this.deleteFromCache(this.buildKeyCacheKey(entity.key));
    await this.deleteFromCache(SystemConfigService.ALL_CONFIGS_CACHE_KEY);
  }

  // =========================================================================
  // Runtime typed helpers để các service khác đọc config linh hoạt qua Cache
  // =========================================================================

  /**
   * Đọc giá trị chuỗi theo key (Cache -> DB -> defaultValue)
   */
  async getValue(key: string, defaultValue?: string): Promise<string | undefined> {
    const trimmedKey = key?.trim();
    if (!trimmedKey) return defaultValue;

    const cacheKey = this.buildKeyCacheKey(trimmedKey);
    const cached = await this.readFromCache<SystemConfigResponse>(cacheKey);
    if (cached) {
      return cached.value;
    }

    const entity = await this.systemConfigRepo.findByKey(trimmedKey);
    if (!entity) {
      return defaultValue;
    }

    const response = this.mapper.map(entity, SystemConfig, SystemConfigResponse);
    await this.writeToCache(cacheKey, response);
    return response.value;
  }

  /**
   * Đọc giá trị số theo key (Cache -> DB -> defaultValue)
   */
  async getNumber(key: string, defaultValue: number): Promise<number> {
    const raw = await this.getValue(key);
    if (raw === undefined || raw.trim() === '') return defaultValue;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  /**
   * Đọc giá trị boolean theo key (Cache -> DB -> defaultValue)
   */
  async getBoolean(key: string, defaultValue: boolean): Promise<boolean> {
    const raw = await this.getValue(key);
    if (raw === undefined) return defaultValue;
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return defaultValue;
  }

  /**
   * Đọc giá trị JSON theo key (Cache -> DB -> defaultValue)
   */
  async getJson<T>(key: string, defaultValue: T): Promise<T> {
    const raw = await this.getValue(key);
    if (raw === undefined) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }
}
