import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Navigation } from '../model/navigation/navigation.entity.js';
import { Role } from '../model/role/role.entity.js';
import { UserRole } from '../model/user-role/user-role.entity.js';

@Injectable()
export class NavigationRepository {
  constructor(
    @InjectRepository(Navigation)
    private readonly navigationRepo: Repository<Navigation>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  /**
   * Lấy toàn bộ danh sách điều hướng, sắp xếp theo thứ tự hiển thị sortOrder và createdAt
   */
  async findAll(): Promise<Navigation[]> {
    return this.navigationRepo.find({
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
      relations: {
        parent: true,
      },
    });
  }

  /**
   * Lấy danh sách menu gốc (parentId IS NULL) kèm theo các cấp con để dựng cây menu
   */
  async findRootNavigations(): Promise<Navigation[]> {
    return this.navigationRepo.find({
      where: {
        parentId: IsNull(),
      },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
      relations: {
        children: {
          children: true,
        },
      },
    });
  }

  /**
   * Tìm kiếm điều hướng theo ID
   */
  async findById(id: string): Promise<Navigation | null> {
    return this.navigationRepo.findOne({
      where: { id },
      relations: {
        parent: true,
      },
    });
  }

  /**
   * Tìm kiếm điều hướng theo ID kèm danh sách con và vai trò liên kết
   */
  async findByIdWithChildrenAndRoles(id: string): Promise<Navigation | null> {
    return this.navigationRepo.findOne({
      where: { id },
      relations: {
        parent: true,
        children: true,
        roleNavigations: true,
      },
    });
  }

  /**
   * Tìm điều hướng theo mã code
   */
  async findByCode(code: string): Promise<Navigation | null> {
    return this.navigationRepo.findOne({
      where: { code },
    });
  }

  /**
   * Tìm danh sách điều hướng con theo parentId
   */
  async findByParentId(parentId: string): Promise<Navigation[]> {
    return this.navigationRepo.find({
      where: { parentId },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Tìm vai trò theo roleId
   */
  async findRoleById(roleId: string): Promise<Role | null> {
    return this.roleRepo.findOne({ where: { id: roleId } });
  }

  /**
   * Tìm vai trò theo tên vai trò (name)
   */
  async findRoleByName(name: string): Promise<Role | null> {
    const trimmed = name.trim();
    return this.roleRepo.findOne({
      where: [{ name: trimmed }, { name: trimmed.toUpperCase() }],
    });
  }

  /**
   * Lấy danh sách vai trò của người dùng theo userId
   */
  async findUserRolesByUserId(userId: string): Promise<UserRole[]> {
    return this.userRoleRepo.find({
      where: { userId },
      relations: {
        role: true,
      },
    });
  }

  /**
   * Lấy danh sách điều hướng được gán cho một vai trò (roleId)
   */
  async findByRoleId(roleId: string): Promise<Navigation[]> {
    return this.navigationRepo
      .createQueryBuilder('navigation')
      .innerJoin('navigation.roleNavigations', 'roleNavigation')
      .where('roleNavigation.roleId = :roleId', { roleId })
      .orderBy('navigation.sortOrder', 'ASC')
      .addOrderBy('navigation.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Tìm danh sách điều hướng theo mảng ID
   */
  async findByIds(ids: string[]): Promise<Navigation[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.navigationRepo.find({
      where: {
        id: In(ids),
      },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Lưu hoặc cập nhật điều hướng
   */
  async save(navigation: Navigation): Promise<Navigation> {
    return this.navigationRepo.save(navigation);
  }

  /**
   * Xóa điều hướng theo ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.navigationRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
