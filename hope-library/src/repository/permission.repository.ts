import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Permission } from '../model/permission/permission.entity.js';
import { Role } from '../model/role/role.entity.js';
import { RolePermission } from '../model/role-permission/role-permission.entity.js';
import { UserRole } from '../model/user-role/user-role.entity.js';
import {
  prepareDocumentForSave,
  toEntities,
  toEntity,
} from '../database/mongo.helper.js';

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel: Model<RolePermission>,
    @InjectModel(UserRole.name)
    private readonly userRoleModel: Model<UserRole>,
  ) {}

  async findAll(): Promise<Permission[]> {
    const docs = await this.permissionModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return toEntities(Permission, docs);
  }

  async findById(id: string): Promise<Permission | null> {
    const doc = await this.permissionModel.findOne({ id }).lean().exec();
    return toEntity(Permission, doc);
  }

  async findByIdWithRolePermissions(id: string): Promise<Permission | null> {
    const doc = await this.permissionModel.findOne({ id }).lean().exec();
    const permission = toEntity(Permission, doc);
    if (!permission) {
      return null;
    }
    const rpDocs = await this.rolePermissionModel
      .find({ permissionId: permission.id })
      .lean()
      .exec();
    permission.rolePermissions = toEntities(RolePermission, rpDocs);
    return permission;
  }

  async findByCode(code: string): Promise<Permission | null> {
    const doc = await this.permissionModel.findOne({ code }).lean().exec();
    return toEntity(Permission, doc);
  }

  async findRoleById(roleId: string): Promise<Role | null> {
    const doc = await this.roleModel.findOne({ id: roleId }).lean().exec();
    return toEntity(Role, doc);
  }

  async findByRoleId(roleId: string): Promise<Permission[]> {
    const rolePerms = await this.rolePermissionModel
      .find({ roleId }, { permissionId: 1 })
      .lean()
      .exec();
    const permIds = [...new Set(rolePerms.map((rp) => rp.permissionId).filter(Boolean))];
    if (permIds.length === 0) return [];

    const docs = await this.permissionModel
      .find({ id: { $in: permIds } })
      .sort({ code: 1 })
      .lean()
      .exec();
    return toEntities(Permission, docs);
  }

  async findByRoleNames(roleNames: string[]): Promise<Permission[]> {
    if (!roleNames || roleNames.length === 0) return [];
    const roles = await this.roleModel
      .find({ name: { $in: roleNames } }, { id: 1 })
      .lean()
      .exec();
    const roleIds = roles.map((r) => r.id).filter(Boolean);
    if (roleIds.length === 0) return [];

    const rolePerms = await this.rolePermissionModel
      .find({ roleId: { $in: roleIds } }, { permissionId: 1 })
      .lean()
      .exec();
    const permIds = [...new Set(rolePerms.map((rp) => rp.permissionId).filter(Boolean))];
    if (permIds.length === 0) return [];

    const docs = await this.permissionModel
      .find({ id: { $in: permIds } })
      .sort({ code: 1 })
      .lean()
      .exec();
    return toEntities(Permission, docs);
  }

  async findByUserId(userId: string): Promise<Permission[]> {
    if (!userId) return [];
    const userRoles = await this.userRoleModel
      .find({ userId }, { roleId: 1 })
      .lean()
      .exec();
    const roleIds = [...new Set(userRoles.map((ur) => ur.roleId).filter(Boolean))];
    if (roleIds.length === 0) return [];

    const rolePerms = await this.rolePermissionModel
      .find({ roleId: { $in: roleIds } }, { permissionId: 1 })
      .lean()
      .exec();
    const permIds = [...new Set(rolePerms.map((rp) => rp.permissionId).filter(Boolean))];
    if (permIds.length === 0) return [];

    const docs = await this.permissionModel
      .find({ id: { $in: permIds } })
      .sort({ code: 1 })
      .lean()
      .exec();
    return toEntities(Permission, docs);
  }

  async create(data: { code: string; description?: string | null }): Promise<Permission> {
    const permission = new Permission(data);
    return this.save(permission);
  }

  async save(permission: Permission): Promise<Permission> {
    const payload = prepareDocumentForSave(permission);
    const saved = await this.permissionModel
      .findOneAndUpdate(
        { id: payload.id },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return toEntity(Permission, saved) ?? permission;
  }

  async delete(id: string): Promise<boolean> {
    await this.rolePermissionModel.deleteMany({ permissionId: id }).exec();
    const result = await this.permissionModel.deleteOne({ id }).exec();
    return (result.deletedCount ?? 0) > 0;
  }
}
