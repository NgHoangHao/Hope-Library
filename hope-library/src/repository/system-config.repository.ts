import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from '../model/system-config/system-config.entity.js';

@Injectable()
export class SystemConfigRepository {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepo: Repository<SystemConfig>,
  ) {}

  async findAll(group?: string): Promise<SystemConfig[]> {
    if (group && group.trim()) {
      return this.systemConfigRepo.find({
        where: { group: group.trim() },
        order: { key: 'ASC' },
      });
    }

    return this.systemConfigRepo.find({
      order: { group: 'ASC', key: 'ASC' },
    });
  }

  async findById(id: string): Promise<SystemConfig | null> {
    return this.systemConfigRepo.findOne({ where: { id } });
  }

  async findByKey(key: string): Promise<SystemConfig | null> {
    return this.systemConfigRepo.findOne({ where: { key } });
  }

  async save(config: SystemConfig): Promise<SystemConfig> {
    return this.systemConfigRepo.save(config);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.systemConfigRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async deleteByKey(key: string): Promise<boolean> {
    const result = await this.systemConfigRepo.delete({ key });
    return (result.affected ?? 0) > 0;
  }
}
