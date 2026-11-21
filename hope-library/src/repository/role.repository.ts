import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../model/role/role.entity.js';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { name } });
  }

  async create(data: { name: string; description?: string | null }): Promise<Role> {
    const role = this.roleRepo.create(data);
    return this.roleRepo.save(role);
  }

  async save(role: Role): Promise<Role> {
    return this.roleRepo.save(role);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.roleRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
