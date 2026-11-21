import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../model/permission/permission.entity.js';
import { Role } from '../model/role/role.entity.js';

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Permission | null> {
    return this.permissionRepo.findOne({ where: { id } });
  }

  async findByIdWithRolePermissions(id: string): Promise<Permission | null> {
    return this.permissionRepo.findOne({
      where: { id },
      relations: {
        rolePermissions: true,
      },
    });
  }

  async findByCode(code: string): Promise<Permission | null> {
    return this.permissionRepo.findOne({ where: { code } });
  }

  async findRoleById(roleId: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { id: roleId } });
  }

  async findByRoleId(roleId: string): Promise<Permission[]> {
    return this.permissionRepo
      .createQueryBuilder('permission')
      .innerJoin('permission.rolePermissions', 'rolePermission')
      .where('rolePermission.roleId = :roleId', { roleId })
      .orderBy('permission.code', 'ASC')
      .getMany();
  }

  async findByRoleNames(roleNames: string[]): Promise<Permission[]> {
    if (!roleNames || roleNames.length === 0) return [];
    return this.permissionRepo
      .createQueryBuilder('permission')
      .innerJoin('permission.rolePermissions', 'rp')
      .innerJoin('rp.role', 'role')
      .where('role.name IN (:...roleNames)', { roleNames })
      .orderBy('permission.code', 'ASC')
      .getMany();
  }

  async findByUserId(userId: string): Promise<Permission[]> {
    if (!userId) return [];
    return this.permissionRepo
      .createQueryBuilder('permission')
      .innerJoin('permission.rolePermissions', 'rp')
      .innerJoin('rp.role', 'role')
      .innerJoin('role.userRoles', 'ur')
      .where('ur.userId = :userId', { userId })
      .orderBy('permission.code', 'ASC')
      .getMany();
  }

  async create(data: { code: string; description?: string | null }): Promise<Permission> {
    const permission = this.permissionRepo.create(data);
    return this.permissionRepo.save(permission);
  }

  async save(permission: Permission): Promise<Permission> {
    return this.permissionRepo.save(permission);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.permissionRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
