import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Navigation } from '../model/navigation/navigation.entity.js';
import { Role } from '../model/role/role.entity.js';
import { UserRole } from '../model/user-role/user-role.entity.js';
import { RoleNavigation } from '../model/role-navigation/role-navigation.entity.js';
import {
  prepareDocumentForSave,
  toEntities,
  toEntity,
} from '../database/mongo.helper.js';

@Injectable()
export class NavigationRepository {
  constructor(
    @InjectModel(Navigation.name)
    private readonly navigationModel: Model<Navigation>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
    @InjectModel(UserRole.name)
    private readonly userRoleModel: Model<UserRole>,
    @InjectModel(RoleNavigation.name)
    private readonly roleNavigationModel: Model<RoleNavigation>,
  ) {}

  /**
   * Lấy toàn bộ danh sách điều hướng, sắp xếp theo thứ tự hiển thị sortOrder và createdAt
   */
  async findAll(): Promise<Navigation[]> {
    const docs = await this.navigationModel
      .find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean()
      .exec();

    const navigations = toEntities(Navigation, docs);
    const navMap = new Map(navigations.map((n) => [n.id, n]));
    for (const nav of navigations) {
      if (nav.parentId) {
        nav.parent = navMap.get(nav.parentId) ?? null;
      }
    }
    return navigations;
  }

  /**
   * Lấy danh sách menu gốc (parentId IS NULL) kèm theo các cấp con để dựng cây menu
   */
  async findRootNavigations(): Promise<Navigation[]> {
    const docs = await this.navigationModel
      .find()
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean()
      .exec();

    const allNavs = toEntities(Navigation, docs);
    const childrenByParent = new Map<string, Navigation[]>();

    for (const nav of allNavs) {
      nav.children = [];
      if (nav.parentId) {
        const list = childrenByParent.get(nav.parentId) ?? [];
        list.push(nav);
        childrenByParent.set(nav.parentId, list);
      }
    }

    for (const nav of allNavs) {
      nav.children = childrenByParent.get(nav.id) ?? [];
    }

    return allNavs.filter((nav) => !nav.parentId);
  }

  /**
   * Tìm kiếm điều hướng theo ID
   */
  async findById(id: string): Promise<Navigation | null> {
    const doc = await this.navigationModel.findOne({ id }).lean().exec();
    const nav = toEntity(Navigation, doc);
    if (!nav) {
      return null;
    }
    if (nav.parentId) {
      const parentDoc = await this.navigationModel
        .findOne({ id: nav.parentId })
        .lean()
        .exec();
      nav.parent = toEntity(Navigation, parentDoc);
    }
    return nav;
  }

  /**
   * Tìm kiếm điều hướng theo ID kèm danh sách con và vai trò liên kết
   */
  async findByIdWithChildrenAndRoles(id: string): Promise<Navigation | null> {
    const doc = await this.navigationModel.findOne({ id }).lean().exec();
    const nav = toEntity(Navigation, doc);
    if (!nav) {
      return null;
    }

    const [parentDoc, childDocs, roleNavDocs] = await Promise.all([
      nav.parentId
        ? this.navigationModel.findOne({ id: nav.parentId }).lean().exec()
        : Promise.resolve(null),
      this.navigationModel
        .find({ parentId: nav.id })
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean()
        .exec(),
      this.roleNavigationModel.find({ navigationId: nav.id }).lean().exec(),
    ]);

    nav.parent = toEntity(Navigation, parentDoc);
    nav.children = toEntities(Navigation, childDocs);
    nav.roleNavigations = toEntities(RoleNavigation, roleNavDocs);
    return nav;
  }

  /**
   * Tìm điều hướng theo mã code
   */
  async findByCode(code: string): Promise<Navigation | null> {
    const doc = await this.navigationModel.findOne({ code }).lean().exec();
    return toEntity(Navigation, doc);
  }

  /**
   * Tìm danh sách điều hướng con theo parentId
   */
  async findByParentId(parentId: string): Promise<Navigation[]> {
    const docs = await this.navigationModel
      .find({ parentId })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean()
      .exec();
    return toEntities(Navigation, docs);
  }

  /**
   * Tìm vai trò theo roleId
   */
  async findRoleById(roleId: string): Promise<Role | null> {
    const doc = await this.roleModel.findOne({ id: roleId }).lean().exec();
    return toEntity(Role, doc);
  }

  /**
   * Tìm vai trò theo tên vai trò (name)
   */
  async findRoleByName(name: string): Promise<Role | null> {
    const trimmed = name.trim();
    const doc = await this.roleModel
      .findOne({
        $or: [{ name: trimmed }, { name: trimmed.toUpperCase() }],
      })
      .lean()
      .exec();
    return toEntity(Role, doc);
  }

  /**
   * Lấy danh sách vai trò của người dùng theo userId
   */
  async findUserRolesByUserId(userId: string): Promise<UserRole[]> {
    const docs = await this.userRoleModel.find({ userId }).lean().exec();
    const userRoles = toEntities(UserRole, docs);
    const roleIds = [...new Set(userRoles.map((ur) => ur.roleId).filter(Boolean))];
    if (roleIds.length > 0) {
      const roleDocs = await this.roleModel
        .find({ id: { $in: roleIds } })
        .lean()
        .exec();
      const roleMap = new Map(
        toEntities(Role, roleDocs).map((r) => [r.id, r]),
      );
      for (const ur of userRoles) {
        ur.role = roleMap.get(ur.roleId);
      }
    }
    return userRoles;
  }

  /**
   * Lấy danh sách điều hướng được gán cho một vai trò (roleId)
   */
  async findByRoleId(roleId: string): Promise<Navigation[]> {
    const roleNavs = await this.roleNavigationModel
      .find({ roleId }, { navigationId: 1 })
      .lean()
      .exec();
    const navIds = [...new Set(roleNavs.map((rn) => rn.navigationId).filter(Boolean))];
    if (navIds.length === 0) {
      return [];
    }

    const docs = await this.navigationModel
      .find({ id: { $in: navIds } })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean()
      .exec();
    return toEntities(Navigation, docs);
  }

  /**
   * Tìm danh sách điều hướng theo mảng ID
   */
  async findByIds(ids: string[]): Promise<Navigation[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const docs = await this.navigationModel
      .find({ id: { $in: ids } })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean()
      .exec();
    return toEntities(Navigation, docs);
  }

  /**
   * Lưu hoặc cập nhật điều hướng
   */
  async save(navigation: Navigation): Promise<Navigation> {
    const payload = prepareDocumentForSave(navigation);
    const saved = await this.navigationModel
      .findOneAndUpdate(
        { id: payload.id },
        { $set: payload },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();
    return toEntity(Navigation, saved) ?? navigation;
  }

  /**
   * Xóa điều hướng theo ID
   */
  async delete(id: string): Promise<boolean> {
    await this.roleNavigationModel.deleteMany({ navigationId: id }).exec();
    const result = await this.navigationModel.deleteOne({ id }).exec();
    return (result.deletedCount ?? 0) > 0;
  }
}
